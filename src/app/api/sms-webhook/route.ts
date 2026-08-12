import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Robust helper to extract EVC Plus payment data from raw SMS.
 * Template: [-EVCPLUS-] waxaad $3.50 ka heshay 0613982172, Tar: 09/08/26 17:58:02...
 */
function extractEVCPayment(smsText: string) {
  try {
    const cleanText = smsText.replace(/\s+/g, ' ').trim();

    // 1. Amount Extraction (e.g. $3.50)
    const amountMatch = cleanText.match(/\$([0-9]+\.?[0-9]*)/);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1]);

    // 2. Phone Extraction
    // Targeting Somali formats: 061..., 61..., 25261...
    // The template usually has a comma after the phone number.
    const phoneMatch = cleanText.match(/(?:0|252)?(61[0-9]{7})/);
    if (!phoneMatch) return null;
    
    // Normalize to 9-digit local format (e.g. 613982172)
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
    // 1. Fetch Dynamic Secret Key from Database
    const settingsSnap = await adminDb.ref('settings/sms_webhook').get();
    const dbSecret = settingsSnap.val()?.secret || 'oskarshop22';
    
    const incomingSecret = request.headers.get('x-webhook-secret');

    // Return 200 even for unauthorized to provide custom message to forwarder logs if needed,
    // but here we keep 401 for security while ensuring the app supports the response.
    if (incomingSecret !== dbSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized', 
        message: 'Invalid x-webhook-secret header.' 
      }, { status: 401 });
    }

    // 2. Payload Parsing
    const body = await request.json().catch(() => ({}));
    const smsText = body.sms || body.text || body.message || '';

    // Acknowledge receipt to the forwarder immediately with 200 OK
    if (!smsText) {
      return NextResponse.json({ success: true, message: 'Received empty payload.' });
    }

    // 3. Extraction
    const extracted = extractEVCPayment(smsText);
    if (!extracted) {
      await adminDb.ref('sms_payments_failed').push({
        raw: smsText,
        receivedAt: now,
        reason: 'Regex failed to extract data.'
      });

      return NextResponse.json({ 
        success: true, 
        matched: false,
        message: 'Could not parse EVC template.',
        received: smsText
      });
    }

    const { amount, phone } = extracted;

    // 4. Order Matching Logic
    const ordersSnap = await adminDb.ref('orders').orderByChild('status').equalTo('pending').get();
    const orders = ordersSnap.val() || {};

    const windowMs = 2 * 60 * 60 * 1000; // 2 hour window
    const matchingEntries = Object.entries(orders)
      .filter(([id, order]: [string, any]) => {
        if (order.smsMatchedId) return false;

        // Clean order phone for comparison (61...)
        const orderPhone = (order.gameDetails?.senderNumber || order.userPhone || '')
          .toString().replace(/\D/g, '').replace(/^0/, '').replace(/^252/, '');

        const phoneMatch = orderPhone === phone;
        const amountMatch = Math.abs(parseFloat(order.total) - amount) < 0.01;
        const withinWindow = Math.abs(now - (order.createdAt || 0)) <= windowMs;

        return phoneMatch && amountMatch && withinWindow;
      })
      .sort((a, b) => (a[1].createdAt - b[1].createdAt));

    // 5. Log the SMS in Database
    const smsRef = adminDb.ref('sms_payments').push();
    await smsRef.set({
      raw: smsText,
      senderPhone: phone,
      amount,
      receivedAt: now,
      matched: matchingEntries.length > 0,
      matchedOrderId: matchingEntries.length > 0 ? matchingEntries[0][0] : null
    });

    if (matchingEntries.length === 0) {
      return NextResponse.json({ 
        success: true, 
        matched: false,
        message: 'SMS Parsed: No matching pending order found in the 2h window.',
        extracted: { amount, phone }
      });
    }

    const [matchId, matchOrder] = matchingEntries[0] as [string, any];

    // 6. Execute Approval
    await adminDb.ref(`orders/${matchId}`).update({
      status: 'successful',
      paymentMatchedAt: now,
      smsMatchedId: smsRef.key,
      approvedBy: 'auto_sms',
      completedAt: now
    });

    // 7. Reward Points
    if (matchOrder.userId) {
      const isAccountOrder = matchOrder.items?.[0]?.gameId === 'accounts' || matchOrder.gameDetails?.postId;
      if (!isAccountOrder) {
        const { ServerValue } = await import('firebase-admin/database');
        await adminDb.ref(`users/${matchOrder.userId}`).update({ points: ServerValue.increment(1) });
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
      matched: true,
      message: `Matched Order #${matchId.toUpperCase()}`,
      data: { amount, sender: phone }
    });

  } catch (err: any) {
    console.error('SMS Webhook Error:', err);
    // Even on error, return 200 with error info so the app shows "delivered"
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}
