import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Webhook for FazerCards order status updates.
 * Path: /api/fazercards/webhook
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ received: true });
    }

    // 1. Robust Payload Extraction
    const orderData = body.order || body.data || body;
    
    const fazercardsOrderId =
      orderData.id ||
      orderData.order_id ||
      orderData.orderId ||
      body.id ||
      body.order_id ||
      null;

    const newStatus =
      orderData.status ||
      body.status ||
      body.order_status ||
      null;

    if (!fazercardsOrderId) {
      console.log('Could not extract order ID from webhook payload');
      return NextResponse.json({ received: true });
    }

    // 2. Full Scan Matching Logic (Supports single orders and special packages)
    const allOrdersSnap = await adminDb.ref('orders').get();
    if (!allOrdersSnap.exists()) {
      return NextResponse.json({ received: true });
    }

    const allOrders = allOrdersSnap.val();
    const matchedEntries = Object.entries(allOrders).filter(([_, order]: [string, any]) => {
      // Check standard ID fields
      const searchId = fazercardsOrderId.toString();
      const ids = (order.autoTopupOrderId || "").toString().split(',').map((s: string) => s.trim());
      const arrayIds = order.fazercardsOrderIds || [];
      
      if (ids.includes(searchId) || arrayIds.includes(searchId) || order.fazercardsOrderId === searchId) {
        return true;
      }

      // Check nested package offer IDs
      if (order.specialPackageDelivery?.offers) {
        return Object.values(order.specialPackageDelivery.offers).some((o: any) => o.fazercardsOrderId === searchId);
      }

      return false;
    });

    if (matchedEntries.length === 0) {
      await adminDb.ref('webhook_logs/fazercards').push({
        raw: body,
        extractedId: fazercardsOrderId,
        extractedStatus: newStatus || 'NOT_FOUND',
        matched: false,
        receivedAt: Date.now()
      });
      return NextResponse.json({ received: true });
    }

    // 3. Process matched orders
    for (const [oskarOrderId, order] of matchedEntries as any) {
      const statusLower = (newStatus || '').toLowerCase().trim();
      const completedStatuses = ['completed', 'complete', 'success', 'done', 'delivered', 'finish', 'finished'];
      const failedStatuses = ['refund', 'refunded', 'cancelled', 'canceled', 'cancel', 'failed', 'fail', 'failure', 'error'];

      // CASE A: Special Package Order
      if (order.specialPackageDelivery?.offers) {
        const delivery = order.specialPackageDelivery;
        const offerEntry = Object.entries(delivery.offers).find(([_, o]: any) => o.fazercardsOrderId === fazercardsOrderId);

        if (offerEntry) {
          const [localOfferId] = offerEntry;
          let offerNewStatus = 'processing';
          if (completedStatuses.includes(statusLower)) offerNewStatus = 'completed';
          else if (failedStatuses.includes(statusLower)) offerNewStatus = 'failed';

          // Update specific offer status
          await adminDb.ref(`orders/${oskarOrderId}/specialPackageDelivery/offers/${localOfferId}`).update({
            status: offerNewStatus,
            completedAt: offerNewStatus === 'completed' ? Date.now() : null
          });

          // Recalculate overall status
          const updatedSnap = await adminDb.ref(`orders/${oskarOrderId}/specialPackageDelivery`).get();
          const updated = updatedSnap.val();
          const allStatuses = Object.values(updated.offers).map((o: any) => o.status);

          let newOverallStatus = 'processing';
          const allDone = allStatuses.every(s => s === 'completed');
          const allFail = allStatuses.every(s => s === 'failed');
          const someFail = allStatuses.some(s => s === 'failed');
          const someDone = allStatuses.some(s => s === 'completed');

          if (allDone) newOverallStatus = 'completed';
          else if (allFail) newOverallStatus = 'failed';
          else if (someDone && someFail) newOverallStatus = 'partial';
          else if (someDone) newOverallStatus = 'processing';

          const compCount = allStatuses.filter(s => s === 'completed').length;
          const failCount = allStatuses.filter(s => s === 'failed').length;

          await adminDb.ref(`orders/${oskarOrderId}/specialPackageDelivery`).update({
            overallStatus: newOverallStatus,
            completedOffers: compCount,
            failedOffers: failCount
          });

          // If entire package is done, finalize main order
          if (newOverallStatus === 'completed') {
            await adminDb.ref(`orders/${oskarOrderId}`).update({
              autoTopupStatus: 'completed',
              status: 'successful',
              completedAt: Date.now()
            });

            // Credit points
            if (order.userId) {
              const { ServerValue } = await import('firebase-admin/database');
              await adminDb.ref(`users/${order.userId}`).update({ points: ServerValue.increment(1) });
            }

            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-telegram`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerName: order.gameDetails?.playerName || 'User',
                orderId: oskarOrderId,
                message: `✅ Special Package FULLY COMPLETED! All ${compCount} items delivered.`
              })
            }).catch(() => {});
          } else if (newOverallStatus === 'failed') {
             await adminDb.ref(`orders/${oskarOrderId}`).update({ autoTopupStatus: 'failed', status: 'cancelled' });
          } else if (newOverallStatus === 'partial') {
             await adminDb.ref(`orders/${oskarOrderId}`).update({ autoTopupStatus: 'partial' });
          }
        }
      } 
      // CASE B: Regular Order
      else {
        let newAutoTopupStatus = 'processing';
        let newOrderStatus = order.status;

        if (completedStatuses.includes(statusLower)) {
          newAutoTopupStatus = 'completed';
          newOrderStatus = 'successful';

          if (order.userId && order.status !== 'successful') {
            const { ServerValue } = await import('firebase-admin/database');
            await adminDb.ref(`users/${order.userId}`).update({ points: ServerValue.increment(1) });
          }
        } else if (failedStatuses.includes(statusLower)) {
          newAutoTopupStatus = 'failed';
          newOrderStatus = 'cancelled';
        }

        await adminDb.ref(`orders/${oskarOrderId}`).update({
          autoTopupStatus: newAutoTopupStatus,
          status: newOrderStatus,
          autoTopupLastWebhook: newStatus,
          autoTopupUpdatedAt: Date.now(),
          completedAt: newOrderStatus === 'successful' ? Date.now() : (order.completedAt || null)
        });
      }

      // Log successful match
      await adminDb.ref('webhook_logs/fazercards').push({
        extractedId: fazercardsOrderId,
        extractedStatus: newStatus,
        matchedOrderId: oskarOrderId,
        matched: true,
        receivedAt: Date.now()
      });
    }

    return NextResponse.json({ received: true, ok: true });
  } catch (err: any) {
    console.error('FazerCards Webhook Error:', err);
    return NextResponse.json({ received: true, error: err.message });
  }
}
