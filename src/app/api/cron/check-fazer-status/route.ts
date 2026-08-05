
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const maxDuration = 60; // Increase timeout for long-running tracking loop

/**
 * High-Frequency Status Tracker
 * Path: /api/cron/check-fazer-status
 * Tracks all 'processing' orders every 1 second until finalized.
 */
export async function GET() {
  try {
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;
    if (!apiKey) return NextResponse.json({ error: 'No API Key' });

    const startTime = Date.now();
    const executionLimit = 55000; // Run for 55 seconds max
    let processedCount = 0;

    // We run a loop to achieve the "every 1 second" tracking requirement
    while (Date.now() - startTime < executionLimit) {
      // 1. Fetch current processing orders
      const ordersSnap = await adminDb.ref('orders')
        .orderByChild('autoTopupStatus')
        .equalTo('processing')
        .get();

      const orders = ordersSnap.val() || {};
      const orderEntries = Object.entries(orders);

      if (orderEntries.length === 0) break; // Exit loop if nothing to track

      // 2. Process all active orders in parallel
      await Promise.all(orderEntries.map(async ([orderId, order]: [string, any]) => {
        const ids = (order.autoTopupOrderId || "").split(',').map((s: string) => s.trim()).filter(Boolean);
        
        const results = await Promise.all(ids.map(async (fId: string) => {
          try {
            const res = await fetch(`https://api.fzr.cards/api/v2/orders/${fId}`, {
              headers: { 
                'accept': 'application/json',
                'X-API-Key': apiKey 
              },
              cache: 'no-store'
            });
            const data = await res.json();
            return data.ok ? data.order : null;
          } catch (e) {
            return null;
          }
        }));

        const validResults = results.filter(r => r !== null);
        if (validResults.length === 0) return;

        // Determine batch status
        const isAllCompleted = validResults.every(r => ['completed', 'success', 'delivered'].includes(r.status?.toLowerCase()));
        const hasFailure = validResults.some(r => ['refund', 'refunded', 'failed', 'rejected', 'canceled', 'cancelled'].includes(r.status?.toLowerCase()));

        if (isAllCompleted) {
          // Success Path
          const orderRef = adminDb.ref(`orders/${orderId}`);
          const currentSnap = await orderRef.get();
          const currentOrder = currentSnap.val();

          // Only update and credit points if not already successful
          if (currentOrder.status !== 'successful') {
            await orderRef.update({
              autoTopupStatus: 'completed',
              status: 'successful',
              autoTopupLastWebhook: 'polling_completed',
              autoTopupUpdatedAt: Date.now(),
              autoTopupResolvedBy: 'high_freq_polling',
              completedAt: Date.now()
            });

            // CREDIT POINTS (Strictly for non-account items)
            const isAccountOrder = 
              currentOrder.items?.[0]?.gameId === 'accounts' || 
              currentOrder.items?.[0]?.gameId === 'event-accounts' || 
              currentOrder.gameDetails?.postId || 
              currentOrder.gameDetails?.isEventWinner;

            if (currentOrder.userId && !isAccountOrder) {
              const { ServerValue } = await import('firebase-admin/database');
              await adminDb.ref(`users/${currentOrder.userId}`).update({
                points: ServerValue.increment(1)
              });
            }

            processedCount++;

            // Notify Telegram
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/notify-telegram`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerName: currentOrder.gameDetails?.playerName || 'User',
                customerPhone: currentOrder.gameDetails?.whatsappNumber,
                itemName: currentOrder.items?.[0]?.title,
                amount: currentOrder.total,
                ffUid: currentOrder.ffUid,
                orderId: orderId,
                message: `✅ High-Freq Poll: COMPLETED! Delivered to ${currentOrder.ffPlayerName || currentOrder.ffUid}.`
              })
            }).catch(() => {});
          }
        } else if (hasFailure) {
          // Failure Path
          await adminDb.ref(`orders/${orderId}`).update({
            autoTopupStatus: 'failed',
            status: 'cancelled',
            autoTopupLastWebhook: 'polling_failed',
            autoTopupUpdatedAt: Date.now(),
            autoTopupResolvedBy: 'high_freq_polling'
          });
          processedCount++;
          
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/notify-telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: order.gameDetails?.playerName || 'User',
              customerPhone: order.gameDetails?.whatsappNumber,
              itemName: order.items?.[0]?.title,
              amount: order.total,
              ffUid: order.ffUid,
              orderId: orderId,
              message: `❌ High-Freq Poll: FAILED/REFUNDED! Manual action required.`
            })
          }).catch(() => {});
        }
      }));

      // Wait 1 second before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
