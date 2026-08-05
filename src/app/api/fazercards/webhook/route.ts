
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

    // 1. Log the raw webhook for debugging
    console.log('FazerCards webhook received:', JSON.stringify(body));

    // FazerCards webhook payload — try all known formats
    // The payload can be nested under data, order, or root level
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

    // Save raw log WITH extracted values for debugging
    await adminDb.ref('webhook_logs/fazercards').push({
      raw: body,
      extractedId: fazercardsOrderId || 'NOT_FOUND',
      extractedStatus: newStatus || 'NOT_FOUND',
      receivedAt: Date.now()
    });

    if (!fazercardsOrderId || !newStatus) {
      console.log('Could not extract order ID or status in webhook payload');
      return NextResponse.json({ received: true });
    }

    // 2. Find the matched OskarShop orders
    // Use the robust query to find any order that includes this ID
    const ordersSnap = await adminDb.ref('orders').get();
    const allOrders = ordersSnap.val() || {};
    
    const matchedEntries = Object.entries(allOrders).filter(([_, order]: [any, any]) => {
      const ids = (order.autoTopupOrderId || "").toString().split(',').map((s: string) => s.trim());
      return ids.includes(fazercardsOrderId.toString());
    });

    if (matchedEntries.length === 0) {
      console.log(`No OskarShop order found for FazerCards ID: ${fazercardsOrderId}`);
      return NextResponse.json({ received: true });
    }

    for (const [oskarOrderId, order] of matchedEntries as any) {
      let newAutoTopupStatus = 'processing';
      let newOrderStatus = order.status;
      const statusLower = newStatus.toLowerCase();

      if (['completed', 'success', 'done', 'delivered'].includes(statusLower)) {
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

        // CREDIT POINTS ON WEBHOOK SUCCESS
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

      } else if (['refund', 'refunded', 'cancelled', 'canceled', 'failed', 'rejected'].includes(statusLower)) {
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

      // Update Order
      await adminDb.ref(`orders/${oskarOrderId}`).update({
        autoTopupStatus: newAutoTopupStatus,
        status: newOrderStatus,
        autoTopupLastWebhook: newStatus,
        autoTopupUpdatedAt: Date.now(),
        completedAt: newOrderStatus === 'successful' ? Date.now() : order.completedAt
      });
    }

    return NextResponse.json({ received: true, ok: true });
  } catch (err: any) {
    console.error('FazerCards webhook error:', err);
    return NextResponse.json({ received: true, error: err.message });
  }
}
