
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
    let phone = phoneMatch[1].replace(/^0/, '').replace(/^252/, '').replace(/^\+252/, '');

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
 * 
 * Optimized for clear response feedback that SMS Forwarder apps support.
 * Returns 200 OK for all authenticated requests to ensure app log success.
 */
export async function POST(request: Request) {
  const now = Date.now();
  const origin = new URL(request.url).origin;

  try {
    // 1. Verify webhook secret
    const secret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.SMS_WEBHOOK_SECRET || 'oskarshop22';

    if (secret !== expectedSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized. Check x-webhook-secret header.',
        powered_by: 'OskarShop Automation'
      }, { status: 200 }); // Returning 200 to keep forwarder app connected
    }

    const body = await request.json().catch(() => ({}));
    const smsText = body.sms || body.text || body.message || '';

    if (!smsText) {
      return NextResponse.json({ 
        success: false, 
        error: 'Empty payload received.',
        powered_by: 'OskarShop Automation'
      }, { status: 200 });
    }

    // Only process EVC Plus SMS
    if (!smsText.includes('EVCPLUS') && !smsText.includes('EVC')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ignored: Not an EVC Plus notification.',
        powered_by: 'OskarShop Automation'
      }, { status: 200 });
    }

    const extracted = extractEVCPayment(smsText);
    if (!extracted) {
      await adminDb.ref('sms_payments_failed').push({
        raw: smsText,
        receivedAt: now,
        reason: 'Regex failed to extract amount/phone from template.'
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Template mismatch. Could not parse amount or phone.',
        sms_received: smsText,
        powered_by: 'OskarShop Automation'
      }, { status: 200 });
    }

    const { amount, phone } = extracted;

    // 2. Save SMS to database for transparency
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
        message: 'SMS received and stored. No matching pending order found in the 2h window.',
        extracted: { amount, sender: phone },
        powered_by: 'OskarShop Automation'
      }, { status: 200 });
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
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const fazercardsConfig = settingsSnap.val();

    if (fazercardsConfig?.enabled) {
      const fullItemSnap = await adminDb.ref(`products/${item?.id}`).get();
      const fullItem = fullItemSnap.val();

      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

      if (fullItem?.category === 'special_package') {
        fetch(`${apiUrl}/api/fazercards/place-special-package`, {
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
         fetch(`${apiUrl}/api/fazercards/place-topup`, {
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
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || origin}/api/notify-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: matchOrder.gameDetails?.playerName || matchOrder.userPhone,
        customerPhone: matchOrder.gameDetails?.whatsappNumber,
        itemName: matchOrder.items?.[0]?.title,
        amount: matchOrder.total,
        orderId: matchId,
        message: `💳 Auto-approved via SMS Match! Phone: ${phone}, Amount: $${amount}`
      })
    }).catch(() => {});

    return NextResponse.json({ 
      success: true, 
      matched: true,
      matched_order: matchId,
      extracted: { amount, sender: phone },
      message: `Order #${matchId.toUpperCase()} auto-approved.`,
      powered_by: 'OskarShop Automation'
    }, { status: 200 });

  } catch (err: any) {
    console.error('SMS Webhook Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      powered_by: 'OskarShop Automation' 
    }, { status: 200 }); 
  }
}
