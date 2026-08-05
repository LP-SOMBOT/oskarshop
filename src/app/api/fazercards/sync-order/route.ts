
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * GET: Manually Poll FazerCards for a specific order.
 * Path: /api/fazercards/sync-order?orderId={oskarOrderId}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

    const orderSnap = await adminDb.ref(`orders/${orderId}`).get();
    if (!orderSnap.exists()) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const order = orderSnap.val();

    if (!order.autoTopupOrderId) return NextResponse.json({ error: 'No provider ID associated' }, { status: 400 });

    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;
    if (!apiKey) return NextResponse.json({ error: 'API Key missing in settings' }, { status: 500 });

    // FazerCards IDs might be comma-separated if it was a batch
    const ids = order.autoTopupOrderId.toString().split(',').map((s: string) => s.trim()).filter(Boolean);
    const firstId = ids[0];

    const res = await fetch(`https://api.fzr.cards/api/v2/orders/${firstId}`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const data = await res.json();
    if (!data.ok || !data.order) return NextResponse.json({ error: 'Provider order not found' }, { status: 404 });

    const fazerStatus = (data.order.status || '').toLowerCase();
    let newAutoTopupStatus = order.autoTopupStatus;
    let newOrderStatus = order.status;

    if (['completed', 'success', 'done', 'delivered'].includes(fazerStatus)) {
      newAutoTopupStatus = 'completed';
      newOrderStatus = 'successful';
    } else if (['refund', 'refunded', 'failed', 'rejected', 'canceled', 'cancelled'].includes(fazerStatus)) {
      newAutoTopupStatus = 'failed';
      newOrderStatus = 'cancelled';
    }

    const updates: any = {
      autoTopupStatus: newAutoTopupStatus,
      status: newOrderStatus,
      autoTopupLastWebhook: `manual_sync_${fazerStatus}`,
      autoTopupUpdatedAt: Date.now()
    };
    
    if (newOrderStatus === 'successful') {
        updates.completedAt = Date.now();
    }

    await adminDb.ref(`orders/${orderId}`).update(updates);

    // Credit points if order just became successful
    if (newOrderStatus === 'successful' && order.status !== 'successful' && order.userId) {
        const isAccountOrder = 
          order.items?.[0]?.gameId === 'accounts' || 
          order.items?.[0]?.gameId === 'event-accounts' || 
          order.gameDetails?.postId || 
          order.gameDetails?.isEventWinner;

        if (!isAccountOrder) {
          const { ServerValue } = await import('firebase-admin/database');
          await adminDb.ref(`users/${order.userId}`).update({
            points: ServerValue.increment(1)
          });
        }
    }

    return NextResponse.json({ success: true, status: fazerStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
