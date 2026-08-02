
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Places a top-up order on FazerCards.
 * Protected with double-charge prevention and idempotency.
 */
export async function POST(request: Request) {
  try {
    const { orderId, category_id, offer_id, playerUid, region } = await request.json();

    if (!orderId || !category_id || !offer_id || !playerUid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.FAZERCARDS_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'FazerCards API Key missing' }, { status: 500 });

    // 1. Fetch Order and Verify State
    const orderRef = adminDb.ref(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    const order = orderSnap.val();

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // CRITICAL: Prevent double top-up
    if (order.autoTopupStatus === 'completed' || order.autoTopupStatus === 'processing') {
      return NextResponse.json({ success: false, error: 'Top-up already processed', alreadyProcessed: true });
    }

    // 2. Mark as processing immediately (locking)
    await orderRef.update({ autoTopupStatus: 'processing' });

    // 3. Prepare FazerCards Payload
    const fields: any = { player_id: playerUid };
    if (region) fields.region = region;

    const idempotencyKey = `oskarshop-${orderId}-${Date.now()}`;

    // 4. Send to Reseller API
    const res = await fetch('https://api.fzr.cards/api/v2/topups/order', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ category_id, offer_id, fields })
    });

    const data = await res.json();

    if (data.ok && data.order) {
      // SUCCESS
      await orderRef.update({
        autoTopupStatus: 'completed',
        autoTopupOrderId: data.order.id,
        status: 'successful' // Auto-complete shop order
      });

      return NextResponse.json({
        success: true,
        fazercardsOrderId: data.order.id,
        status: data.order.status
      });
    } else {
      // FAILURE
      await orderRef.update({
        autoTopupStatus: 'failed',
        autoTopupError: data.error || 'FazerCards order failed'
      });

      return NextResponse.json({
        success: false,
        error: data.error || 'FazerCards API error'
      });
    }
  } catch (err: any) {
    console.error('FazerCards Top-up Placement Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
