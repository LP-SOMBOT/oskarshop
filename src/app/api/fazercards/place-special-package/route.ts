import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Places a sequential batch of top-up orders for a Special Package.
 * Path: /api/fazercards/place-special-package
 * 
 * Fetches API Key directly from DB for security and accuracy.
 */
export async function POST(request: Request) {
  try {
    const { orderId, playerUid, playerRegion, gameFields } = await request.json();

    if (!orderId || !playerUid) {
      return NextResponse.json({ success: false, error: 'Missing orderId or playerUid' }, { status: 400 });
    }

    // 1. Fetch Config and API Key from Database
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const config = settingsSnap.val();
    const apiKey = config?.apiKey;
    const isEnabled = config?.enabled;

    if (!isEnabled || !apiKey) {
      return NextResponse.json({ success: false, error: 'FazerCards automation is disabled or API key missing' }, { status: 403 });
    }

    // 2. Load Order and Item Configuration
    const orderRef = adminDb.ref(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    const order = orderSnap.val();

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    const itemId = order.items?.[0]?.id;
    const itemSnap = await adminDb.ref(`products/${itemId}`).get();
    const item = itemSnap.val();

    if (!item?.specialPackage?.offers?.length) {
      return NextResponse.json({ success: false, error: 'Item has no package offers configured' }, { status: 400 });
    }

    const offers = item.specialPackage.offers;

    // Prevent double delivery
    if (order.specialPackageDelivery?.overallStatus === 'completed' || order.specialPackageDelivery?.overallStatus === 'processing') {
      return NextResponse.json({ success: false, error: 'Package already being processed', alreadyProcessed: true });
    }

    // 3. Initialize Delivery State for Admin Log
    const deliveryOffers: any = {};
    offers.forEach((offer: any) => {
      deliveryOffers[offer.id] = {
        category_id: offer.category_id,
        offer_id: offer.offer_id,
        offerName: offer.offerName,
        fazercardsOrderId: null,
        status: 'pending',
        placedAt: null,
        completedAt: null,
        error: null
      };
    });

    await orderRef.update({
      autoTopupStatus: 'processing',
      autoTopupStartedAt: Date.now(),
      specialPackageDelivery: {
        totalOffers: offers.length,
        completedOffers: 0,
        failedOffers: 0,
        offers: deliveryOffers,
        overallStatus: 'processing'
      }
    });

    const availableData: any = {
      player_id: playerUid,
      user_id: playerUid,
      uid: playerUid,
      region: playerRegion || 'MENA',
      server: playerRegion || 'MENA',
      ...(gameFields || {})
    };

    let completedCount = 0;
    let failedCount = 0;
    const fazercardsOrderIds: string[] = [];

    // 4. Sequential Placement Loop
    for (const offer of offers) {
      try {
        // Fetch required fields for this specific category
        const offRes = await fetch(`https://api.fzr.cards/api/v2/topups/offers?category_id=${offer.category_id}`, {
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        });
        const offData = await offRes.json();
        const requiredKeys = (offData.fields || []).map((f: any) => f.key);

        const fields: any = {};
        requiredKeys.forEach((key: string) => {
          if (availableData[key]) fields[key] = availableData[key];
        });

        const idempotencyKey = `oskar-pkg-${orderId}-${offer.id}-${Date.now()}`;

        const res = await fetch('https://api.fzr.cards/api/v2/topups/order', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify({ 
            category_id: offer.category_id, 
            offer_id: offer.offer_id, 
            fields 
          })
        });

        const data = await res.json();

        if (data.ok && data.order) {
          fazercardsOrderIds.push(data.order.id);
          await adminDb.ref(`orders/${orderId}/specialPackageDelivery/offers/${offer.id}`).update({
            fazercardsOrderId: data.order.id,
            status: 'processing',
            placedAt: Date.now()
          });
          completedCount++;
        } else {
          failedCount++;
          await adminDb.ref(`orders/${orderId}/specialPackageDelivery/offers/${offer.id}`).update({
            status: 'failed',
            error: data.error || 'Provider rejected order'
          });
        }

        // Delay to prevent rate limiting (respecting FazerCards limits)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err: any) {
        failedCount++;
        await adminDb.ref(`orders/${orderId}/specialPackageDelivery/offers/${offer.id}`).update({
          status: 'failed',
          error: err.message
        });
      }
    }

    // 5. Finalize Status and Notify
    let overallStatus = 'processing';
    if (failedCount === offers.length) overallStatus = 'failed';

    await orderRef.update({
      autoTopupOrderId: fazercardsOrderIds.join(', '),
      autoTopupOrderIds: fazercardsOrderIds,
      fazercardsOrderIds: fazercardsOrderIds,
      'specialPackageDelivery/completedOffers': completedCount,
      'specialPackageDelivery/failedOffers': failedCount,
      'specialPackageDelivery/overallStatus': overallStatus
    });

    const origin = new URL(request.url).origin;
    fetch(`${origin}/api/notify-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: order.gameDetails?.playerName || 'User',
        customerPhone: order.gameDetails?.whatsappNumber,
        itemName: order.items?.[0]?.title,
        amount: order.total,
        orderId: orderId,
        message: `📦 Special Package INITIATED: ${completedCount}/${offers.length} parts placed. Tracking IDs: ${fazercardsOrderIds.join(', ')}`
      })
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      totalOffers: offers.length,
      placed: completedCount,
      failed: failedCount,
      fazercardsOrderIds
    });

  } catch (err: any) {
    console.error('Special Package Execution Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}