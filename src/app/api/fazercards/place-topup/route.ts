import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Places a top-up order on FazerCards.
 * Optimized for v2 documentation schema.
 */
export async function POST(request: Request) {
  try {
    const { orderId, category_id, offer_id, playerUid, region } = await request.json();

    if (!orderId || !category_id || !offer_id || !playerUid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch API Key from database
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;

    if (!apiKey) return NextResponse.json({ success: false, error: 'FazerCards API Key missing in settings' }, { status: 500 });

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
    // Based on documentation: fields is a key-value object
    const fields: any = { player_id: playerUid.toString() };
    
    // Use user-provided region 'MENA' if specified, or passed region
    const effectiveRegion = region || 'MENA';
    
    // We only include region if it's not explicitly disabled (some categories fail if provided)
    // However, user specifically asked to include it.
    fields.region = effectiveRegion;

    // Use lowercase header name and deterministic unique string for idempotency
    const idempotencyKey = `oskarshop-${orderId}`;

    // 4. Send to Reseller API
    const res = await fetch('https://api.fzr.cards/api/v2/topups/order', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'idempotency-key': idempotencyKey
      },
      body: JSON.stringify({ category_id, offer_id, fields })
    });

    const data = await res.json();

    if (data.ok && data.order) {
      // SUCCESS
      await orderRef.update({
        autoTopupStatus: 'completed',
        autoTopupOrderId: data.order.id,
        status: 'successful', // Consolidate to successful
        completedAt: Date.now()
      });

      return NextResponse.json({
        success: true,
        fazercardsOrderId: data.order.id,
        status: data.order.status
      });
    } else {
      // FAILURE - If the error was about unexpected 'region', we try a fallback once automatically
      if (data.error && data.error.includes('region') && data.error.includes('not expected')) {
        console.log(`Auto-retry without region for category ${category_id}`);
        
        const fallbackRes = await fetch('https://api.fzr.cards/api/v2/topups/order', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
            'idempotency-key': `${idempotencyKey}-retry`
          },
          body: JSON.stringify({ category_id, offer_id, fields: { player_id: playerUid.toString() } })
        });
        
        const fallbackData = await fallbackRes.json();
        if (fallbackData.ok && fallbackData.order) {
          await orderRef.update({
            autoTopupStatus: 'completed',
            autoTopupOrderId: fallbackData.order.id,
            status: 'successful',
            completedAt: Date.now()
          });
          return NextResponse.json({ success: true, fazercardsOrderId: fallbackData.order.id });
        }
      }

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
