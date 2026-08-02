
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Webhook for FazerCards order status updates.
 * Updates the shop order status in Realtime Database based on provider feedback.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id: fazercardsOrderId, status: fazercardsStatus, error } = data;

    if (!fazercardsOrderId) {
      return NextResponse.json({ success: false, error: 'Missing FazerCards ID' }, { status: 400 });
    }

    // 1. Find the corresponding order in our database
    const ordersSnap = await adminDb.ref('orders').get();
    const orders = ordersSnap.val() || {};
    
    let matchedOrderId = null;
    let matchedOrder = null;

    for (const [id, order] of Object.entries(orders)) {
      if ((order as any).autoTopupOrderId === fazercardsOrderId) {
        matchedOrderId = id;
        matchedOrder = order;
        break;
      }
    }

    if (!matchedOrderId || !matchedOrder) {
      return NextResponse.json({ success: false, error: 'Order not found for this FazerCards ID' });
    }

    // 2. Map FazerCards status to shop status
    // Expected FazerCards statuses: completed, processing, failed, rejected
    const updates: any = {};
    
    if (fazercardsStatus === 'completed') {
      updates.status = 'successful';
      updates.autoTopupStatus = 'completed';
      updates.completedAt = Date.now();
    } else if (fazercardsStatus === 'failed' || fazercardsStatus === 'rejected') {
      updates.autoTopupStatus = 'failed';
      updates.autoTopupError = error || 'FazerCards failed delivery';
      // We don't automatically cancel the order to allow admin retry
    } else if (fazercardsStatus === 'processing') {
      updates.autoTopupStatus = 'processing';
    }

    // 3. Persist changes
    await adminDb.ref(`orders/${matchedOrderId}`).update(updates);

    return NextResponse.json({ success: true, message: `Order ${matchedOrderId} updated to ${fazercardsStatus}` });

  } catch (err: any) {
    console.error('FazerCards Webhook Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
