
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Fallback Polling Logic
 * Path: /api/cron/check-fazer-status
 * Runs manually or via Vercel Cron.
 */
export async function GET() {
  try {
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;
    if (!apiKey) return NextResponse.json({ error: 'No API Key' });

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    // Find processing orders
    const ordersSnap = await adminDb.ref('orders')
      .orderByChild('autoTopupStatus')
      .equalTo('processing')
      .get();

    const orders = ordersSnap.val() || {};
    const updates: any[] = [];

    for (const [orderId, order] of Object.entries(orders) as any) {
      if (order.autoTopupStartedAt && order.autoTopupStartedAt < fiveMinutesAgo) {
        // Poll for EACH ID in comma-separated list
        const ids = (order.autoTopupOrderId || "").split(',').map((s: string) => s.trim()).filter(Boolean);
        
        for (const fId of ids) {
          try {
            const res = await fetch(`https://api.fzr.cards/api/v2/orders/${fId}`, {
              headers: { 'X-API-Key': apiKey }
            });
            const data = await res.json();
            
            if (data.ok && data.order) {
              const fStatus = data.order.status?.toLowerCase();
              
              if (['completed', 'success', 'delivered'].includes(fStatus)) {
                await adminDb.ref(`orders/${orderId}`).update({
                  autoTopupStatus: 'completed',
                  status: 'successful',
                  autoTopupLastWebhook: fStatus,
                  autoTopupUpdatedAt: Date.now(),
                  autoTopupResolvedBy: 'polling',
                  completedAt: Date.now()
                });
                // Note: Point crediting would ideally happen here too if not already successful
                updates.push({ orderId, status: 'completed' });
              } else if (['refund', 'refunded', 'failed', 'rejected'].includes(fStatus)) {
                await adminDb.ref(`orders/${orderId}`).update({
                  autoTopupStatus: 'failed',
                  status: 'cancelled',
                  autoTopupLastWebhook: fStatus,
                  autoTopupUpdatedAt: Date.now(),
                  autoTopupResolvedBy: 'polling'
                });
                updates.push({ orderId, status: 'failed' });
              }
            }
          } catch (e) {
            console.error(`Poll failed for order ${fId}`, e);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: updates.length, details: updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
