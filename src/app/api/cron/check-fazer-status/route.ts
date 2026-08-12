import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const maxDuration = 60;

/**
 * Polling Fallback & SMS Cleanup Job
 * Path: /api/cron/check-fazer-status
 */
export async function GET() {
  try {
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;
    
    // TASK 1: Poll stuck orders
    if (apiKey) {
      const processingSnap = await adminDb.ref('orders')
        .orderByChild('autoTopupStatus')
        .equalTo('processing')
        .get();

      if (processingSnap.exists()) {
        const processingOrders = processingSnap.val();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        for (const [orderId, order] of Object.entries(processingOrders) as any) {
          if (!order.autoTopupOrderId) continue;
          if (order.autoTopupStartedAt > fiveMinutesAgo) continue;

          try {
            const res = await fetch(`https://api.fzr.cards/api/v2/orders/${order.autoTopupOrderId.toString().split(',')[0].trim()}`, {
              headers: { 'accept': 'application/json', 'X-API-Key': apiKey },
              cache: 'no-store'
            });
            const data = await res.json();
            if (!data.ok || !data.order) continue;

            const fazerStatus = (data.order.status || '').toLowerCase();
            const completedStatuses = ['completed', 'success', 'done', 'delivered'];
            const failedStatuses = ['refund', 'refunded', 'failed', 'rejected', 'canceled', 'cancelled'];

            if (completedStatuses.includes(fazerStatus)) {
              await adminDb.ref(`orders/${orderId}`).update({
                autoTopupStatus: 'completed',
                status: 'successful',
                autoTopupLastWebhook: `polling_${fazerStatus}`,
                autoTopupUpdatedAt: Date.now(),
                completedAt: Date.now()
              });
              if (order.userId) {
                const { ServerValue } = await import('firebase-admin/database');
                await adminDb.ref(`users/${order.userId}`).update({ points: ServerValue.increment(1) });
              }
            } else if (failedStatuses.includes(fazerStatus)) {
              await adminDb.ref(`orders/${orderId}`).update({
                autoTopupStatus: 'failed',
                status: 'cancelled',
                autoTopupLastWebhook: `polling_${fazerStatus}`,
                autoTopupUpdatedAt: Date.now()
              });
            }
          } catch (err) {}
        }
      }
    }

    // TASK 2: Mark expired SMS payments
    const smsSnap = await adminDb.ref('sms_payments').orderByChild('matched').equalTo(false).get();
    if (smsSnap.exists()) {
      const smsList = smsSnap.val();
      const twoHours = 2 * 60 * 60 * 1000;
      const now = Date.now();
      const updates: any = {};

      for (const [id, sms] of Object.entries(smsList) as any) {
        if (!sms.expired && (now - (sms.receivedAt || 0)) > twoHours) {
          updates[`sms_payments/${id}/expired`] = true;
        }
      }
      if (Object.keys(updates).length > 0) {
        await adminDb.ref().update(updates);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}