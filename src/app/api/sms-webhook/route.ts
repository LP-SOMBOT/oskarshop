
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Helper to extract EVC Plus payment data from raw SMS.
 */
function extractEVCPayment(smsText: string) {
  try {
    // EVC Plus format: "[-EVCPLUS-] waxaad $1.19 ka heshay 0615484693..."
    const amountMatch = smsText.match(/\$([0-9]+\.?[0-9]*)\s+ka\s+heshay/);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1]);

    const phoneMatch = smsText.match(/ka\s+heshay\s+(0?6[0-9]{8})/);
    if (!phoneMatch) return null;
    
    // Normalize: strip 0 and 252 to get 9-digit local (e.g., 615484693)
    const phone = phoneMatch[1].replace(/^0/, '').replace(/^252/, '');

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
  try {
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== process.env.SMS_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const smsText = body.sms || body.text || body.message || '';

    if (!smsText) return NextResponse.json({ error: 'No content' }, { status: 400 });

    // Only EVC Plus
    if (!smsText.includes('EVCPLUS') && !smsText.includes('EVC')) {
      return NextResponse.json({ success: false, message: 'Ignored: Not EVC Plus' });
    }

    const extracted = extractEVCPayment(smsText);
    if (!extracted) return NextResponse.json({ success: false, message: 'Parse failed' });

    const { amount, phone } = extracted;
    const now = Date.now();

    // 1. Log SMS
    const smsRef = adminDb.ref('sms_payments').push();
    await smsRef.set({
      raw: smsText,
      senderPhone: phone,
      amount,
      receivedAt: now,
      matched: false,
      matchedOrderId: null
    });

    // 2. Find matching order
    const ordersSnap = await adminDb.ref('orders').orderByChild('status').equalTo('pending').get();
    const orders = ordersSnap.val();

    if (!orders) return NextResponse.json({ success: true, message: 'Logged. No pending orders.' });

    const twoHours = 2 * 60 * 60 * 1000;
    const matchingOrders = Object.entries(orders)
      .filter(([id, order]: [string, any]) => {
        if (order.smsMatchedId) return false;

        const orderPhone = (order.gameDetails?.senderNumber || order.userPhone || '')
          .toString().replace(/\D/g, '').replace(/^0/, '').replace(/^252/, '');

        const phoneMatch = orderPhone === phone;
        const amountMatch = Math.abs(parseFloat(order.total) - amount) < 0.01;
        const withinWindow = Math.abs(now - order.createdAt) <= twoHours;

        return phoneMatch && amountMatch && withinWindow;
      })
      .sort((a, b) => (a[1].createdAt - b[1].createdAt)); // Priority to oldest

    if (matchingOrders.length === 0) {
      return NextResponse.json({ success: true, message: 'Logged. No match found.' });
    }

    const [matchId, matchOrder] = matchingOrders[0];

    // 3. Mark Matched
    await adminDb.ref(`sms_payments/${smsRef.key}`).update({
      matched: true,
      matchedOrderId: matchId
    });

    // 4. Update Order (Approving automatically to successful)
    await adminDb.ref(`orders/${matchId}`).update({
      status: 'successful',
      paymentMatchedAt: now,
      smsMatchedId: smsRef.key,
      approvedBy: 'auto_sms',
      completedAt: now
    });

    // 5. Trigger Auto Topup if enabled on item
    const item = matchOrder.items?.[0];
    if (item?.autoTopupEnabled && item?.fazercardsCategory_id && item?.fazercardsOffer_id) {
       // Fire and forget
       fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/fazercards/place-topup`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           orderId: matchId,
           category_id: item.fazercardsCategory_id,
           offer_id: item.fazercardsOffer_id,
           playerUid: matchOrder.ffUid || matchOrder.gameDetails?.playerID,
           region: matchOrder.ffRegion || 'ME'
         })
       }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: `Matched order ${matchId}` });

  } catch (err: any) {
    console.error('SMS Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
