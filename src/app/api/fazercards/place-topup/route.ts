
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Places a top-up order on FazerCards.
 * Dynamically builds the fields object using keys required by the specific category.
 */
export async function POST(request: Request) {
  try {
    const { orderId, category_id, offer_id, fields: providedFields } = await request.json();

    if (!orderId || !category_id || !offer_id) {
      return NextResponse.json({ success: false, error: 'Missing order parameters' }, { status: 400 });
    }

    // Fetch config from DB
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const config = settingsSnap.val();
    const apiKey = config?.apiKey;
    const isEnabled = config?.enabled;

    if (!isEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reseller automation is globally disabled.' 
      }, { status: 403 });
    }

    if (!apiKey) return NextResponse.json({ success: false, error: 'FazerCards API Key missing' }, { status: 500 });

    const orderRef = adminDb.ref(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    const order = orderSnap.val();

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    if (order.autoTopupStatus === 'completed' || order.autoTopupStatus === 'processing') {
      return NextResponse.json({ success: false, error: 'Top-up already processed', alreadyProcessed: true });
    }

    // STEP 1: Fetch required fields for this category
    const offersRes = await fetch(`https://api.fzr.cards/api/v2/topups/offers?category_id=${category_id}`, {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
    });
    const offersData = await offersRes.json();
    const requiredFields = offersData.fields || [];
    const requiredFieldKeys = requiredFields.map((f: any) => f.key);

    const multiplier = order.items?.[0]?.fazercardsMultiQuantity || 1;

    await orderRef.update({ 
      autoTopupStatus: 'processing',
      autoTopupBatchTotal: multiplier,
      autoTopupBatchCompleted: 0
    });

    // STEP 2: Build fields object dynamically
    // Use the comprehensive gameFields collected at checkout
    const sourceData = providedFields || order.gameDetails?.gameFields || {};
    
    // Also include top-level identifiers for backward compatibility
    const fallbackData: any = {
      player_id: order.ffUid || order.gameDetails?.playerID,
      user_id: order.ffUid || order.gameDetails?.playerID,
      uid: order.ffUid || order.gameDetails?.playerID,
    };

    const finalFields: any = {};
    for (const key of requiredFieldKeys) {
      const val = sourceData[key] ?? fallbackData[key];
      if (val !== null && val !== undefined) {
        finalFields[key] = val.toString();
      }
    }

    const results: string[] = [];
    let errors: string[] = [];

    for (let i = 0; i < multiplier; i++) {
      const partId = i + 1;
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 2000));

      const idempotencyKey = `oskar-${orderId}-${partId}-${Date.now()}`;

      try {
        const res = await fetch('https://api.fzr.cards/api/v2/topups/order', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
            'idempotency-key': idempotencyKey
          },
          body: JSON.stringify({ category_id, offer_id, fields: finalFields })
        });

        const data = await res.json();

        if (data.ok && data.order) {
          results.push(data.order.id);
          await orderRef.update({ autoTopupBatchCompleted: partId });
        } else {
          errors.push(`Part ${partId}: ${data.error || 'Failed'}`);
          break; 
        }
      } catch (err: any) {
        errors.push(`Part ${partId}: ${err.message}`);
        break;
      }
    }

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
        orderUpdate.status = 'cancelled';
        orderUpdate.cancellationReason = `Automation partial failure: ${results.length}/${multiplier} delivered. Error: ${errors.join('; ')}`;
      }

      if (errors.length > 0) orderUpdate.autoTopupError = errors.join('; ');
      await orderRef.update(orderUpdate);

      return NextResponse.json({ success: isFullSuccess, fazercardsOrderIds: results.join(', ') });
    } else {
      await orderRef.update({
        autoTopupStatus: 'failed',
        autoTopupError: errors.join('; '),
        status: 'cancelled',
        cancellationReason: 'Automation failed to initiate: ' + errors.join('; ')
      });
      return NextResponse.json({ success: false, error: errors.join('; ') });
    }
  } catch (err: any) {
    console.error('FazerCards dynamic top-up error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
