
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Places a top-up order on FazerCards.
 * Dynamically builds the fields object using keys required by the specific category.
 */
export async function POST(request: Request) {
  try {
    const { orderId, category_id, offer_id, fields: providedFields } = await request.json();

    if (!orderId || !category_id || !offer_id) {
      return NextResponse.json({ success: false, error: 'Missing order parameters' }, { status: 400 });
    }

    // Fetch config from DB
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const config = settingsSnap.val();
    const apiKey = config?.apiKey;
    const isEnabled = config?.enabled;

    if (!isEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reseller automation is globally disabled.' 
      }, { status: 403 });
    }

    if (!apiKey) return NextResponse.json({ success: false, error: 'FazerCards API Key missing' }, { status: 500 });

    const orderRef = adminDb.ref(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    const order = orderSnap.val();

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Allow retry if failed, but block if already processing or completed
    if (order.autoTopupStatus === 'completed' || order.autoTopupStatus === 'processing') {
      return NextResponse.json({ success: false, error: 'Top-up already in progress or completed', alreadyProcessed: true });
    }

    // STEP 1: Fetch required fields for this category
    const offersRes = await fetch(`https://api.fzr.cards/api/v2/topups/offers?category_id=${category_id}`, {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
    });
    const offersData = await offersRes.json();
    const requiredFields = offersData.fields || [];
    const requiredFieldKeys = requiredFields.map((f: any) => f.key);

    const multiplier = order.items?.[0]?.fazercardsMultiQuantity || 1;

    await orderRef.update({ 
      autoTopupStatus: 'processing',
      autoTopupBatchTotal: multiplier,
      autoTopupBatchCompleted: 0,
      autoTopupStartedAt: Date.now()
    });

    // STEP 2: Build fields object dynamically
    const sourceData = providedFields || order.gameDetails?.gameFields || {};
    const fallbackData: any = {
      player_id: order.ffUid || order.gameDetails?.playerID,
      user_id: order.ffUid || order.gameDetails?.playerID,
      uid: order.ffUid || order.gameDetails?.playerID,
    };

    const finalFields: any = {};
    for (const key of requiredFieldKeys) {
      const val = sourceData[key] ?? fallbackData[key];
      if (val !== null && val !== undefined) {
        finalFields[key] = val.toString();
      }
    }

    const results: string[] = [];
    let errors: string[] = [];

    for (let i = 0; i < multiplier; i++) {
      const partId = i + 1;
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 2000));

      const idempotencyKey = `oskar-${orderId}-${partId}-${Date.now()}`;

      try {
        const res = await fetch('https://api.fzr.cards/api/v2/topups/order', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
            'idempotency-key': idempotencyKey
          },
          body: JSON.stringify({ category_id, offer_id, fields: finalFields })
        });

        const data = await res.json();

        if (data.ok && data.order) {
          results.push(data.order.id);
          await orderRef.update({ autoTopupBatchCompleted: partId });
        } else {
          errors.push(`Part ${partId}: ${data.error || 'Failed'}`);
          break; 
        }
      } catch (err: any) {
        errors.push(`Part ${partId}: ${err.message}`);
        break;
      }
    }

    if (results.length > 0) {
      // Store IDs in multiple redundant fields to ensure webhook matching
      const providerIdStr = results.join(', ');
      await orderRef.update({
        autoTopupStatus: 'processing',
        autoTopupOrderId: providerIdStr,
        fazercardsOrderId: providerIdStr,
        providerOrderId: providerIdStr,
        autoTopupError: errors.length > 0 ? errors.join('; ') : null
      });

      // Send Telegram processing notification
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/notify-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: order.gameDetails?.playerName || order.userPhone,
          customerPhone: order.gameDetails?.whatsappNumber,
          itemName: order.items?.[0]?.title,
          amount: order.total,
          ffUid: order.ffUid,
          orderId: orderId,
          message: `⏳ Auto top-up PROCESSING — FazerCards IDs: ${providerIdStr}. Monitoring for delivery.`
        })
      }).catch(() => {});

      return NextResponse.json({ 
        success: true, 
        fazercardsOrderId: providerIdStr,
        status: 'processing',
        message: 'Order placed. Tracking started.'
      });
    } else {
      await orderRef.update({
        autoTopupStatus: 'failed',
        autoTopupError: errors.join('; '),
        status: 'cancelled',
        cancellationReason: 'Automation failed to initiate: ' + errors.join('; ')
      });
      return NextResponse.json({ success: false, error: errors.join('; ') });
    }
  } catch (err: any) {
    console.error('FazerCards dynamic top-up error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
