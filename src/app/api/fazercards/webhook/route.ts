
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

    // 2. Full Scan Matching Logic (Guaranteed reliability)
    const allOrdersSnap = await adminDb.ref('orders').get();
    if (!allOrdersSnap.exists()) {
      return NextResponse.json({ received: true });
    }

    const allOrders = allOrdersSnap.val();
    const matchedEntries = Object.entries(allOrders).filter(([_, order]: [string, any]) => {
      // Check all possible provider ID fields
      const searchId = fazercardsOrderId.toString();
      const ids = (order.autoTopupOrderId || "").toString().split(',').map((s: string) => s.trim());
      
      return (
        ids.includes(searchId) ||
        order.fazercardsOrderId === searchId ||
        order.providerOrderId === searchId
      );
    });

    if (matchedEntries.length === 0) {
      // Log unmatched webhook (Normal for initial "created" events)
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

      let newAutoTopupStatus = 'processing';
      let newOrderStatus = order.status;

      const completedStatuses = ['completed', 'complete', 'success', 'done', 'delivered', 'finish', 'finished'];
      const failedStatuses = ['refund', 'refunded', 'cancelled', 'canceled', 'cancel', 'failed', 'fail', 'failure', 'error'];

      if (completedStatuses.includes(statusLower)) {
        newAutoTopupStatus = 'completed';
        newOrderStatus = 'successful';

        // Notify Telegram of completion
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/notify-telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: order.gameDetails?.playerName || 'User',
            customerPhone: order.gameDetails?.whatsappNumber,
            itemName: order.items?.[0]?.title,
            amount: order.total,
            ffUid: order.ffUid,
            orderId: oskarOrderId,
            message: `✅ Auto top-up COMPLETED via Webhook! FazerCards: ${fazercardsOrderId}`
          })
        }).catch(() => {});

        // Credit point on success
        const isAccountOrder = 
          order.items?.[0]?.gameId === 'accounts' || 
          order.items?.[0]?.gameId === 'event-accounts' || 
          order.gameDetails?.postId || 
          order.gameDetails?.isEventWinner;

        if (order.userId && !isAccountOrder && order.status !== 'successful') {
          const { ServerValue } = await import('firebase-admin/database');
          await adminDb.ref(`users/${order.userId}`).update({
            points: ServerValue.increment(1)
          });
        }

      } else if (failedStatuses.includes(statusLower)) {
        newAutoTopupStatus = 'failed';
        newOrderStatus = 'cancelled';

        // Notify Telegram of failure
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/notify-telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: order.gameDetails?.playerName || 'User',
            customerPhone: order.gameDetails?.whatsappNumber,
            itemName: order.items?.[0]?.title,
            amount: order.total,
            ffUid: order.ffUid,
            orderId: oskarOrderId,
            message: `❌ Auto top-up REFUNDED/FAILED via Webhook! FazerCards: ${fazercardsOrderId} — Status: ${newStatus}.`
          })
        }).catch(() => {});
      }

      // Update Order State
      await adminDb.ref(`orders/${oskarOrderId}`).update({
        autoTopupStatus: newAutoTopupStatus,
        status: newOrderStatus,
        autoTopupLastWebhook: newStatus,
        autoTopupUpdatedAt: Date.now(),
        completedAt: newOrderStatus === 'successful' ? Date.now() : (order.completedAt || null)
      });

      // Log successful match
      await adminDb.ref('webhook_logs/fazercards').push({
        raw: body,
        extractedId: fazercardsOrderId,
        extractedStatus: newStatus,
        matchedOrderId: oskarOrderId,
        matched: true,
        receivedAt: Date.now()
      });
    }

    return NextResponse.json({ received: true, ok: true });
  } catch (err: any) {
    console.error('FazerCards webhook error:', err);
    return NextResponse.json({ received: true, error: err.message });
  }
}
