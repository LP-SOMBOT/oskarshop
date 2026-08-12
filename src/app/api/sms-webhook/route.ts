import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Robust helper to extract EVC Plus payment data from raw SMS.
 * Supports various Somali EVC Plus formats.
 */
function extractEVCPayment(smsText: string) {
  try {
    // Clean string: remove newlines and extra spaces
    const cleanText = smsText.replace(/\s+/g, ' ').trim();

    // 1. Amount Extraction (Support both "ka heshay" and "soo xawilay" formats)
    const amountMatch = cleanText.match(/\$([0-9]+\.?[0-9]*)/);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1]);

    // 2. Phone Extraction (Look for 9-digit Somali number starting with 6)
    // Matches 061..., 25261..., 61...
    const phoneMatch = cleanText.match(/(?:0|252)?(6[0-9]{8})/);
    if (!phoneMatch) return null;
    
    // Normalize: return just the 9-digit local part (e.g., 615484693)
    const phone = phoneMatch[1];

    return { amount, phone };
  } catch {
    return null;
  }
}

/**
 * POST: Receives forwarded SMS and auto-approves matched orders.
 * Path: /api/sms-webhook
 */
export async function POST(request: Request) {
  const now = Date.now();
  const origin = new URL(request.url).origin;

  try {
    // 1. Security Check
    const secret = request.headers.get('x-webhook-secret');
    const configSecret = process.env.SMS_WEBHOOK_SECRET || 'oskar-secure-secret-2026';

    if (secret !== configSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access', 
        message: 'The x-webhook-secret header is missing or incorrect.' 
      }, { status: 401 });
    }

    // 2. Payload Parsing
    const body = await request.json().catch(() => ({}));
    const smsText = body.sms || body.text || body.message || '';

    if (!smsText) {
      return NextResponse.json({ 
        success: false, 
        error: 'No content', 
        message: 'Payload must contain an "sms" field.' 
      }, { status: 400 });
    }

    // 3. Extraction
    const extracted = extractEVCPayment(smsText);
    if (!extracted) {
      // Still log the attempt for debugging
      await adminDb.ref('sms_payments_failed').push({
        raw: smsText,
        receivedAt: now,
        reason: 'Regex failed to extract amount or phone'
      });

      return NextResponse.json({ 
        success: false, 
        error: 'Parsing failed', 
        message: 'Could not extract amount or phone from SMS. Ensure it is an EVC Plus message.',
        raw_text: smsText
      });
    }

    const { amount, phone } = extracted;

    // 4. Order Matching Logic
    const ordersSnap = await adminDb.ref('orders').orderByChild('status').equalTo('pending').get();
    const orders = ordersSnap.val() || {};

    const twoHours = 2 * 60 * 60 * 1000;
    const matchingOrders = Object.entries(orders)
      .filter(([id, order]: [string, any]) => {
        // Skip already matched or processed
        if (order.smsMatchedId || order.status !== 'pending') return false;

        // Clean order phone for comparison
        const orderPhone = (order.gameDetails?.senderNumber || order.userPhone || '')
          .toString().replace(/\D/g, '').replace(/^0/, '').replace(/^252/, '');

        const phoneMatch = orderPhone === phone;
        const amountMatch = Math.abs(parseFloat(order.total) - amount) < 0.01;
        const withinWindow = Math.abs(now - (order.createdAt || 0)) <= twoHours;

        return phoneMatch && amountMatch && withinWindow;
      })
      .sort((a, b) => (a[1].createdAt - b[1].createdAt)); // Oldest first

    // 5. Always Log the SMS (Success or Failure)
    const smsRef = adminDb.ref('sms_payments').push();
    const smsLogData = {
      raw: smsText,
      senderPhone: phone,
      amount,
      receivedAt: now,
      matched: matchingOrders.length > 0,
      matchedOrderId: matchingOrders.length > 0 ? matchingOrders[0][0] : null
    };
    await smsRef.set(smsLogData);

    if (matchingOrders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'SMS Logged, but no matching pending order found.',
        data: { amount, phone, time: new Date(now).toISOString() }
      });
    }

    const [matchId, matchOrder] = matchingOrders[0] as [string, any];

    // 6. Execute Matching (DB Updates)
    await adminDb.ref(`orders/${matchId}`).update({
      status: 'successful',
      paymentMatchedAt: now,
      smsMatchedId: smsRef.key,
      approvedBy: 'auto_sms',
      completedAt: now
    });

    // 7. Reward Points
    if (matchOrder.userId) {
      const isAccountOrder = 
        matchOrder.items?.[0]?.gameId === 'accounts' || 
        matchOrder.items?.[0]?.gameId === 'event-accounts' || 
        matchOrder.gameDetails?.postId || 
        matchOrder.gameDetails?.isEventWinner;

      if (!isAccountOrder) {
        const { ServerValue } = await import('firebase-admin/database');
        await adminDb.ref(`users/${matchOrder.userId}`).update({
          points: ServerValue.increment(1)
        });
      }
    }

    // 8. Trigger Reseller Automation
    const item = matchOrder.items?.[0];
    const fazercardsConfigSnap = await adminDb.ref('settings/fazercards').get();
    const fazercardsConfig = fazercardsConfigSnap.val();

    if (fazercardsConfig?.enabled) {
      const fullItemSnap = await adminDb.ref(`products/${item?.id}`).get();
      const fullItem = fullItemSnap.val();

      if (fullItem?.category === 'special_package') {
        fetch(`${origin}/api/fazercards/place-special-package`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: matchId,
            playerUid: matchOrder.ffUid || matchOrder.gameDetails?.playerID,
            playerRegion: matchOrder.ffRegion || 'MENA',
            gameFields: matchOrder.gameDetails?.gameFields
          })
        }).catch(() => {});
      } else if (item?.autoTopupEnabled) {
         fetch(`${origin}/api/fazercards/place-topup`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             orderId: matchId,
             category_id: item.fazercardsCategory_id,
             offer_id: item.fazercardsOffer_id,
             fields: matchOrder.gameDetails?.gameFields
           })
         }).catch(() => {});
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully matched and approved Order #${matchId.toUpperCase()}`,
      data: {
        orderId: matchId,
        amount,
        sender: phone
      }
    });

  } catch (err: any) {
    console.error('SMS Webhook Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error', 
      detail: err.message 
    }, { status: 500 });
  }
}
