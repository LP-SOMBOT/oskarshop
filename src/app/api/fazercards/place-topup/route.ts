import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Places a top-up order on FazerCards.
 * Optimized for v2 documentation schema.
 * Supports Multi-Order logic (multiplier) for fulfilling higher quantities.
 * Includes explicit delays between batch calls to prevent rate-limiting/conflicts.
 */
export async function POST(request: Request) {
  try {
    const { orderId, category_id, offer_id, playerUid, region } = await request.json();

    if (!orderId || !category_id || !offer_id || !playerUid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch API Key and Reseller settings from database
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const config = settingsSnap.val();
    const apiKey = config?.apiKey;
    const isEnabled = config?.enabled;

    // 0. Global Automation Toggle Check
    if (!isEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reseller automation is globally disabled in admin settings.' 
      }, { status: 403 });
    }

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
      
      // Delay consecutive requests to prevent provider-side "duplicate request" blocks
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const idempotencyKey = `oskarshop-${orderId}-${partId}-${Date.now()}`;
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
               continue; 
             }
          }
          errors.push(`Part ${partId}: ${data.error || 'Failed'}`);
          break; 
        }
      } catch (err: any) {
        errors.push(`Part ${partId}: ${err.message}`);
        break;
      }
    }

    // 5. Finalize Order Status
    if (results.length > 0) {
      const isFullSuccess = results.length === multiplier;
      const finalStatus = isFullSuccess ? 'completed' : 'failed';
      const orderUpdate: any = {
        autoTopupStatus: finalStatus,
        autoTopupOrderId: results.join(', '),
      };

      if (isFullSuccess) {
        orderUpdate.status = 'successful';
        orderUpdate.completedAt = Date.now();
      } else {
        // ANY failure to complete (including partial) marks as cancelled as per requirements
        orderUpdate.status = 'cancelled';
        orderUpdate.cancellationReason = `Automation partial failure: Only ${results.length}/${multiplier} parts delivered. Error: ${errors.join('; ')}`;
      }

      if (errors.length > 0) {
        orderUpdate.autoTopupError = errors.join('; ');
      }

      await orderRef.update(orderUpdate);

      return NextResponse.json({
        success: isFullSuccess,
        fazercardsOrderIds: results.join(', '),
        multiplierUsed: multiplier,
        completedParts: results.length,
        errors: errors.length > 0 ? errors.join('; ') : undefined
      });
    } else {
      // FULL FAILURE: Mark order as cancelled
      await orderRef.update({
        autoTopupStatus: 'failed',
        autoTopupError: errors.join('; '),
        status: 'cancelled',
        cancellationReason: 'Automation failed to initiate: ' + errors.join('; ')
      });

      return NextResponse.json({
        success: false,
        error: errors.join('; '),
        completedParts: 0,
        totalParts: multiplier
      });
    }
  } catch (err: any) {
    console.error('FazerCards Multi-Top-up Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
