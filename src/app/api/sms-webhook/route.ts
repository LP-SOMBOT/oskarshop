import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Robust helper to extract EVC Plus payment data from raw SMS.
 * Template: [-EVCPLUS-] waxaad $3.50 ka heshay 0613982172, Tar: 09/08/26 17:58:02...
 */
function extractEVCPayment(smsText: string) {
  try {
    const cleanText = smsText.replace(/\s+/g, ' ').trim();

    // 1. Extract amount: number after $ before " ka heshay"
    const amountMatch = cleanText.match(/\$([0-9]+\.?[0-9]*)\s+ka\s+heshay/);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1]);

    // 2. Extract sender phone: number after "ka heshay "
    const phoneMatch = cleanText.match(/ka\s+heshay\s+(0?6[0-9]{8})/);
    if (!phoneMatch) return null;
    
    // Normalize to 9-digit format (strip leading 0 or country code)
    let phone = phoneMatch[1].replace(/^0/, '').replace(/^252/, '');

    // Validate: must be 9 digits starting with 6
    if (!/^6[0-9]{8}$/.test(phone)) return null;

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
    // 1. Verify webhook secret
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== process.env.SMS_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const smsText = body.sms || body.text || body.message || '';

    if (!smsText) {
      return NextResponse.json({ success: true, message: 'Received empty payload.' });
    }

    // Only process EVC Plus SMS
    if (!smsText.includes('EVCPLUS') && !smsText.includes('EVC')) {
      return NextResponse.json({ success: true, message: 'Not an EVC Plus SMS — ignored' });
    }

    const extracted = extractEVCPayment(smsText);
    if (!extracted) {
      await adminDb.ref('sms_payments_failed').push({
        raw: smsText,
        receivedAt: now,
        reason: 'Pattern mismatch for EVC Plus template.'
      });
      return NextResponse.json({ success: true, message: 'Could not extract payment details' });
    }

    const { amount, phone } = extracted;

    // 2. Save SMS to database
    const smsRef = adminDb.ref('sms_payments').push();
    await smsRef.set({
      raw: smsText,
      senderPhone: phone,
      amount,
      receivedAt: now,
      matched: false,
      matchedOrderId: null,
      expired: false
    });
    const smsId = smsRef.key;

    // 3. Find matching pending orders
    const ordersSnap = await adminDb.ref('orders').orderByChild('status').equalTo('pending').get();
    const orders = ordersSnap.val() || {};

    const twoHours = 2 * 60 * 60 * 1000;
    const matchingEntries = Object.entries(orders)
      .filter(([id, order]: [string, any]) => {
        if (order.smsMatchedId) return false;

        // Normalize order phone (strip 0, 252, +252)
        const orderPhone = (order.gameDetails?.senderNumber || order.userPhone || '')
          .toString().replace(/\D/g, '').replace(/^0/, '').replace(/^252/, '');

        const phoneMatch = orderPhone === phone;
        const amountMatch = Math.abs(parseFloat(order.total) - amount) < 0.01;
        
        const orderTime = order.createdAt || 0;
        const withinWindow = Math.abs(now - orderTime) <= twoHours;

        return phoneMatch && amountMatch && withinWindow;
      })
      .sort((a, b) => (a[1].createdAt - b[1].createdAt)); // FIRST ORDER PRIORITY

    if (matchingEntries.length === 0) {
      return NextResponse.json({ 
        success: true, 
        smsId,
        matched: false, 
        message: 'SMS saved. No matching pending order found.',
        extracted: { amount, phone }
      });
    }

    const [matchId, matchOrder] = matchingEntries[0] as [string, any];

    // 4. Execute Approval
    await adminDb.ref(`orders/${matchId}`).update({
      status: 'successful',
      paymentMatchedAt: now,
      smsMatchedId: smsId,
      approvedBy: 'auto_sms',
      completedAt: now
    });

    await adminDb.ref(`sms_payments/${smsId}`).update({
      matched: true,
      matchedOrderId: matchId
    });

    // 5. Reward Points
    if (matchOrder.userId) {
      const isAccountOrder = matchOrder.items?.[0]?.gameId === 'accounts' || matchOrder.gameDetails?.postId;
      if (!isAccountOrder) {
        const { ServerValue } = await import('firebase-admin/database');
        await adminDb.ref(`users/${matchOrder.userId}`).update({ points: ServerValue.increment(1) });
      }
    }

    // 6. Trigger Reseller Automation
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

    // 7. Notify Telegram
    fetch(`${origin}/api/notify-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: matchOrder.gameDetails?.playerName || matchOrder.userPhone,
        customerPhone: matchOrder.gameDetails?.whatsappNumber,
        itemName: matchOrder.items?.[0]?.title,
        amount: matchOrder.total,
        orderId: matchId,
        message: `💳 Auto-approved via SMS! Phone: ${phone}, Amount: $${amount}`
      })
    }).catch(() => {});

    return NextResponse.json({ 
      success: true, 
      matched: true,
      message: `Successfully Matched Order #${matchId.toUpperCase()}`,
      data: { amount, sender: phone }
    });

  } catch (err: any) {
    console.error('SMS Webhook Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 }); 
  }
}