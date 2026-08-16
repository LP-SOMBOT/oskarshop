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
 */
export async function POST(request: Request) {
  try {
    // 1. SECRET KEY VERIFICATION
    const headerSecret = request.headers.get('x-webhook-secret');
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');
    const providedSecret = headerSecret || querySecret;
    const expectedSecret = process.env.SMS_WEBHOOK_SECRET || 'oskarshop22';

    if (providedSecret !== expectedSecret) {
      await adminDb.ref('/webhook_logs/sms_failed').push({
        reason: 'Invalid secret',
        provided: providedSecret,
        receivedAt: Date.now()
      });
      return NextResponse.json(
        { error: 'Unauthorized', hint: 'Check your x-webhook-secret header' },
        { status: 401 }
      );
    }

    // 2. PARSE BODY
    let rawSms = '';
    let senderRaw = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      rawSms = body.sms || body.msg || body.message || body.text || body.body || body.Message || '';
      senderRaw = body.from || body.sender || body.From || body.number || body.phone || '';
    } else {
      const text = await request.text().catch(() => '');
      const params = new URLSearchParams(text);
      rawSms = params.get('sms') || params.get('msg') || params.get('message') || params.get('text') || text;
      senderRaw = params.get('from') || params.get('sender') || '';
    }

    if (!rawSms) {
      return NextResponse.json({ success: false, message: 'No SMS text found' }, { status: 400 });
    }

    // 3. CLEAN SMS TEXT
    let cleanSms = rawSms
      .replace(/^From\s*:\s*[^\s]*\([^)]*\)\s*/i, '')
      .replace(/^From\s*:\s*\S+\s*/i, '')
      .trim();

    if (cleanSms.length < 10) cleanSms = rawSms;

    // 4. LOG RAW SMS
    await adminDb.ref('/sms_raw_log').push({
      raw: rawSms,
      cleaned: cleanSms,
      sender: senderRaw,
      receivedAt: Date.now()
    });

    // 5. CHECK IF EVC PLUS
    const isEvc = cleanSms.includes('EVCPLUS') || 
                  cleanSms.includes('EVC') || 
                  cleanSms.includes('waxaad') || 
                  cleanSms.includes('ka heshay');

    if (!isEvc) {
      return NextResponse.json({ success: true, matched: false, message: 'Non-EVC SMS ignored' });
    }

    // 6. EXTRACT PAYMENT DETAILS
    const amountMatch = cleanSms.match(/\$\s*([0-9]+\.?[0-9]*)\s+ka\s+heshay/i);
    if (!amountMatch) {
      return NextResponse.json({ success: false, message: 'Could not extract amount' });
    }
    const amount = parseFloat(amountMatch[1]);

    const phoneMatch = cleanSms.match(/ka\s+heshay\s+([\+0-9]+)/i);
    let phone = "";
    if (phoneMatch) {
      phone = phoneMatch[1].replace(/^\+252/, '').replace(/^252/, '').replace(/^0/, '').replace(/\s/g, '');
    }

    if (!/^6[0-9]{8}$/.test(phone)) {
      const altMatch = cleanSms.match(/\b(6[0-9]{8})\b/);
      if (altMatch) phone = altMatch[1];
      else return NextResponse.json({ success: false, message: 'Invalid phone format' });
    }

    const now = Date.now();
    const smsRef = adminDb.ref('/sms_payments').push();
    await smsRef.set({ raw: cleanSms, senderPhone: phone, amount, receivedAt: now, matched: false, expired: false });
    const smsId = smsRef.key;

    // 7. MATCH PENDING ORDERS
    const ordersSnap = await adminDb.ref('/orders').get();
    if (!ordersSnap.exists()) return NextResponse.json({ success: true, smsId, matched: false, message: 'SMS saved, no orders' });

    const allOrders = ordersSnap.val();
    const twoHours = 2 * 60 * 60 * 1000;
    const pendingStatuses = ['pending', 'waiting', 'waiting_payment', 'unpaid', 'new', 'created'];

    const matches = Object.entries(allOrders)
      .filter(([id, order]: [string, any]) => {
        const status = (order.status || '').toLowerCase();
        if (!pendingStatuses.includes(status) || order.smsMatchedId) return false;

        const rawOrderPhone = (order.senderPhone || order.customerPhone || order.phone || '').toString();
        const normOrderPhone = rawOrderPhone.replace(/^\+252/, '').replace(/^252/, '').replace(/^0/, '').replace(/[^0-9]/g, '').slice(-9);

        const phoneOk = normOrderPhone === phone.slice(-9);
        const amountOk = Math.abs(parseFloat(order.total || order.amount || 0) - amount) < 0.02;
        const timeOk = Math.abs(now - (order.createdAt || order.placedAt || 0)) <= twoHours;

        return phoneOk && amountOk && timeOk;
      })
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));

    if (matches.length === 0) {
      return NextResponse.json({ success: true, smsId, matched: false, phone, amount, message: 'SMS saved, no match found' });
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
      adminDb.ref(`/products/${itemId}`).get().then(snap => {
        const item = snap.val();
        if (item?.autoTopupEnabled || item?.category === 'special_package') {
          const endpoint = item.category === 'special_package' ? '/api/fazercards/place-special-package' : '/api/fazercards/place-topup';
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so'}${endpoint}`, {
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
      });
    }

    // 10. NOTIFY
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so'}/api/notify-telegram`, {
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

    return NextResponse.json({ success: true, smsId, matched: true, matchedOrderId, message: `Approved #${matchedOrderId}` });

  } catch (err: any) {
    console.error('SMS Webhook Error:', err);
    return NextResponse.json({ success: true, error: err.message });
  }
}
