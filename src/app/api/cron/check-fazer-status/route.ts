
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const maxDuration = 60;

/**
 * Polling Fallback Job
 * Path: /api/cron/check-fazer-status
 * Checks orders that have been in "processing" for more than 5 minutes.
 */
export async function GET() {
  try {
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;
    if (!apiKey) return NextResponse.json({ error: 'No API Key' });

    const processingSnap = await adminDb.ref('orders')
      .orderByChild('autoTopupStatus')
      .equalTo('processing')
      .get();

    if (!processingSnap.exists()) {
      return NextResponse.json({ success: true, message: 'No orders to poll' });
    }

    const processingOrders = processingSnap.val();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    let processedCount = 0;

    for (const [orderId, order] of Object.entries(processingOrders) as any) {
      if (!order.autoTopupOrderId) continue;
      // Only poll if it has been stuck for more than 5 minutes
      if (order.autoTopupStartedAt > fiveMinutesAgo) continue;

      try {
        const res = await fetch(`https://api.fzr.cards/api/v2/orders/${order.autoTopupOrderId}`, {
          headers: { 
            'accept': 'application/json',
            'X-API-Key': apiKey 
          },
          cache: 'no-store'
        });
        const data = await res.json();
        
        if (!data.ok || !data.order) continue;

        const fazerStatus = (data.order.status || '').toLowerCase();

        if (['completed', 'success', 'done', 'delivered'].includes(fazerStatus)) {
          // Success Path
          await adminDb.ref(`orders/${orderId}`).update({
            autoTopupStatus: 'completed',
            status: 'successful',
            autoTopupLastWebhook: `polling_${fazerStatus}`,
            autoTopupUpdatedAt: Date.now(),
            autoTopupResolvedBy: 'polling',
            completedAt: Date.now()
          });

          // CREDIT POINTS
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
          processedCount++;
        } else if (['refund', 'refunded', 'failed', 'rejected', 'canceled', 'cancelled'].includes(fazerStatus)) {
          // Failure Path
          await adminDb.ref(`orders/${orderId}`).update({
            autoTopupStatus: 'failed',
            status: 'cancelled',
            autoTopupLastWebhook: `polling_${fazerStatus}`,
            autoTopupUpdatedAt: Date.now(),
            autoTopupResolvedBy: 'polling'
          });
          processedCount++;
        }
      } catch (err) {
        console.error(`Polling error for order ${orderId}:`, err);
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
