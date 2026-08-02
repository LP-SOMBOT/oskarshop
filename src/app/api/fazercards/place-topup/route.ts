
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Places a top-up order on FazerCards.
 * Optimized for v2 documentation schema.
 * Supports Multi-Order logic (multiplier) for fulfilling higher quantities.
 */
export async function POST(request: Request) {
  try {
    const { orderId, category_id, offer_id, playerUid, region } = await request.json();

    if (!orderId || !category_id || !offer_id || !playerUid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch API Key and Reseller settings from database
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

    // 2. Determine Multiplier (How many times to repeat the offer)
    // We check if the product has a specific multiplier set
    const item = order.items?.[0];
    const multiplier = item?.fazercardsMultiQuantity || 1;

    // 3. Mark as processing immediately (locking)
    await orderRef.update({ 
      autoTopupStatus: 'processing',
      autoTopupBatchTotal: multiplier,
      autoTopupBatchCompleted: 0
    });

    const results: string[] = [];
    let errors: string[] = [];
    const effectiveRegion = region || 'MENA';

    // 4. Execute Multi-Order Loop
    for (let i = 0; i < multiplier; i++) {
      const partId = i + 1;
      const idempotencyKey = `oskarshop-${orderId}-${partId}`;
      const fields: any = { 
        player_id: playerUid.toString(),
        region: effectiveRegion
      };

      try {
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
          results.push(data.order.id);
          // Update progress in DB for long-running batches
          await orderRef.update({ autoTopupBatchCompleted: partId });
        } else {
          // Handle specific errors like 'region not expected'
          if (data.error && data.error.includes('region') && data.error.includes('not expected')) {
             // Retry part without region
             const retryRes = await fetch('https://api.fzr.cards/api/v2/topups/order', {
               method: 'POST',
               headers: {
                 'X-API-Key': apiKey,
                 'Content-Type': 'application/json',
                 'idempotency-key': `${idempotencyKey}-fallback`
               },
               body: JSON.stringify({ category_id, offer_id, fields: { player_id: playerUid.toString() } })
             });
             const retryData = await retryRes.json();
             if (retryData.ok && retryData.order) {
               results.push(retryData.order.id);
               await orderRef.update({ autoTopupBatchCompleted: partId });
               continue; // Move to next in multiplier loop
             }
          }
          errors.push(`Part ${partId}: ${data.error || 'Failed'}`);
          // If a part fails, we stop the sequence to prevent partial fulfillment issues
          break;
        }
      } catch (err: any) {
        errors.push(`Part ${partId}: ${err.message}`);
        break;
      }
    }

    // 5. Finalize Order Status
    if (results.length === multiplier) {
      // FULL SUCCESS
      await orderRef.update({
        autoTopupStatus: 'completed',
        autoTopupOrderId: results.join(', '),
        status: 'successful',
        completedAt: Date.now()
      });

      return NextResponse.json({
        success: true,
        fazercardsOrderIds: results,
        multiplierUsed: multiplier
      });
    } else {
      // PARTIAL OR FULL FAILURE
      await orderRef.update({
        autoTopupStatus: 'failed',
        autoTopupError: errors.join('; '),
        autoTopupOrderId: results.length > 0 ? results.join(', ') : undefined
      });

      return NextResponse.json({
        success: false,
        error: errors.join('; '),
        completedParts: results.length,
        totalParts: multiplier
      });
    }
  } catch (err: any) {
    console.error('FazerCards Multi-Top-up Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
