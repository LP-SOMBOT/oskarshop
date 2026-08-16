
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * GET: Health check for status verification.
 */
export async function GET() {
  return NextResponse.json({
    status: 'READY AND ACTIVE',
    message: 'OskarShop SMS Webhook is online. Send a POST request with x-webhook-secret header to use it.',
    usage: 'POST /api/sms-webhook',
    powered_by: 'OskarShop Automation'
  });
}

/**
 * OPTIONS: CORS preflight.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    }
  });
}

/**
 * POST: Receive forwarded SMS and match to pending orders.
 * This route is highly permissive to ensure successful transmission from forwarder apps.
 */
export async function POST(request: Request) {
  let smsText = '';
  let senderRaw = '';

  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. DYNAMIC BODY PARSING
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      smsText = body.sms || body.msg || body.message || body.text || body.body || body.Message || body.data || JSON.stringify(body);
      senderRaw = body.from || body.sender || body.From || body.number || body.phone || '';
    } else if (contentType.includes('form')) {
      const text = await request.text().catch(() => '');
      const params = new URLSearchParams(text);
      smsText = params.get('sms') || params.get('msg') || params.get('message') || params.get('text') || text;
      senderRaw = params.get('from') || params.get('sender') || '';
    } else {
      smsText = await request.text().catch(() => '');
    }

    // 2. LOG EVERYTHING FOR DEBUGGING (Independent of matching)
    try {
      await adminDb.ref('/sms_raw_log').push({
        raw: smsText || 'EMPTY_BODY',
        headers: {
          contentType,
          secret: request.headers.get('x-webhook-secret'),
          userAgent: request.headers.get('user-agent'),
        },
        receivedAt: Date.now()
      });
    } catch (dbErr) {
      console.error('DB log error:', dbErr);
    }

    if (!smsText || smsText.length < 5) {
      return NextResponse.json({ success: true, received: true, message: 'Received but text too short' });
    }

    // 3. CLEAN SMS TEXT (Remove forwarder prefixes)
    const textToParse = smsText
      .replace(/^From\s*:\s*[^\s]*\([^)]*\)\s*/i, '')
      .replace(/^From\s*:\s*\S+\s*/i, '')
      .trim() || smsText;

    // 4. CHECK IF EVC PLUS
    const isEvc = textToParse.includes('EVCPLUS') || textToParse.includes('EVC') || textToParse.includes('ka heshay');
    if (!isEvc) {
      return NextResponse.json({ success: true, received: true, isEvc: false, message: 'Non-EVC SMS ignored' });
    }

    // 5. EXTRACT PAYMENT DETAILS
    const amountMatch = textToParse.match(/\$\s*([0-9]+\.?[0-9]*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    let phone = null;
    const afterKaHeshay = textToParse.match(/ka\s+heshay\s+([\+0-9]+)/i);
    if (afterKaHeshay) {
      phone = afterKaHeshay[1]
        .replace(/^\+252/, '')
        .replace(/^252/, '')
        .replace(/^0/, '')
        .replace(/[^0-9]/g, '');
    }

    // Fallback phone extraction
    if (!phone || phone.length < 8) {
      const fallback = textToParse.match(/\b(6[0-9]{8})\b/);
      if (fallback) phone = fallback[1];
    }

    if (!phone || !amount) {
      return NextResponse.json({ success: true, received: true, isEvc: true, extracted: { phone, amount }, message: 'Could not parse amount or phone' });
    }

    // 6. SAVE SMS RECORD
    const now = Date.now();
    const smsRef = adminDb.ref('/sms_payments').push();
    await smsRef.set({
      raw: textToParse,
      senderPhone: phone,
      amount,
      receivedAt: now,
      matched: false,
      matchedOrderId: null,
      expired: false
    });
    const smsId = smsRef.key;

    // 7. MATCH PENDING ORDERS
    const ordersSnap = await adminDb.ref('/orders').get();
    if (!ordersSnap.exists()) return NextResponse.json({ success: true, smsId, phone, amount, matched: false, message: 'SMS saved, no orders found' });

    const allOrders = ordersSnap.val();
    const twoHours = 2 * 60 * 60 * 1000;
    const pendingStatuses = ['pending', 'waiting', 'waiting_payment', 'unpaid', 'new', 'created'];

    const matches = Object.entries(allOrders)
      .filter(([id, order]: [string, any]) => {
        if (order.smsMatchedId) return false;
        const status = (order.status || '').toLowerCase();
        if (!pendingStatuses.includes(status)) return false;

        const rawPhone = String(order.gameDetails?.senderNumber || order.userPhone || order.senderPhone || '');
        const normPhone = rawPhone.replace(/^\+252/, '').replace(/^252/, '').replace(/^0/, '').replace(/[^0-9]/g, '').slice(-9);

        const phoneOk = normPhone === phone!.slice(-9);
        const amountOk = Math.abs(parseFloat(order.total || order.amount || 0) - amount) < 0.02;
        const timeOk = Math.abs(now - (order.createdAt || order.placedAt || 0)) <= twoHours;

        return phoneOk && amountOk && timeOk;
      })
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));

    if (matches.length === 0) {
      return NextResponse.json({ success: true, smsId, phone, amount, matched: false, message: 'SMS saved, no match found' });
    }

    // 8. APPROVE ORDER
    const [matchedOrderId, matchedOrder]: [string, any] = matches[0];
    await adminDb.ref(`/sms_payments/${smsId}`).update({ matched: true, matchedOrderId });
    await adminDb.ref(`/orders/${matchedOrderId}`).update({
      status: 'approved',
      paymentMatchedAt: now,
      smsMatchedId: smsId,
      approvedBy: 'auto_sms',
      approvedAt: now
    });

    // 9. TRIGGER AUTOMATION
    const itemId = matchedOrder.items?.[0]?.id || matchedOrder.itemId;
    if (itemId) {
      const itemSnap = await adminDb.ref(`/products/${itemId}`).get();
      const item = itemSnap.val();
      if (item?.autoTopupEnabled || item?.category === 'special_package') {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so';
        const endpoint = item.category === 'special_package' ? '/api/fazercards/place-special-package' : '/api/fazercards/place-topup';
        fetch(`${appUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: matchedOrderId,
            category_id: item.fazercardsCategory_id,
            offer_id: item.fazercardsOffer_id,
            playerUid: matchedOrder.ffUid || matchedOrder.gameDetails?.playerID,
            playerRegion: matchedOrder.ffRegion || 'MENA',
            gameFields: matchedOrder.gameDetails?.gameFields || {}
          })
        }).catch(() => {});
      }
    }

    // 10. NOTIFY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so';
    fetch(`${appUrl}/api/notify-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: matchedOrder.gameDetails?.playerName || 'User',
        customerPhone: matchedOrder.gameDetails?.whatsappNumber || phone,
        itemName: matchedOrder.items?.[0]?.title || 'Item',
        amount: matchedOrder.total || amount,
        orderId: matchedOrderId,
        message: `💳 Auto-matched! Phone: ${phone} Amount: $${amount}`
      })
    }).catch(() => {});

    return NextResponse.json({ success: true, smsId, phone, amount, matched: true, matchedOrderId });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ success: true, error: err.message }); // Still return 200 to satisfy app
  }
}
