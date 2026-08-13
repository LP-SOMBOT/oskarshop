
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * GET: Health check for browser tests.
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
      'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret',
    }
  });
}

/**
 * POST: Receive forwarded SMS and match to pending orders.
 */
export async function POST(request: Request) {
  try {
    const db = adminDb;

    // 1. SECRET KEY VERIFICATION
    const headerSecret = request.headers.get('x-webhook-secret');
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');
    const providedSecret = headerSecret || querySecret;
    const expectedSecret = process.env.SMS_WEBHOOK_SECRET || 'oskarshop22';

    if (providedSecret !== expectedSecret) {
      await db.ref('/webhook_logs/sms_failed').push({
        reason: 'Invalid secret',
        provided: providedSecret,
        receivedAt: Date.now()
      });
      return NextResponse.json(
        { error: 'Unauthorized', hint: 'Check your x-webhook-secret header' },
        { status: 401 }
      );
    }

    // 2. PARSE BODY (Handles JSON and Form-Encoded)
    let rawSms = '';
    let senderRaw = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      let body: any = {};
      try { body = await request.json(); } catch { body = {}; }
      rawSms = body.sms || body.msg || body.message || body.text || body.body || body.Message || '';
      senderRaw = body.from || body.sender || body.From || body.number || body.phone || '';
    } else {
      try {
        const text = await request.text();
        const params = new URLSearchParams(text);
        rawSms = params.get('sms') || params.get('msg') || params.get('message') || params.get('text') || '';
        senderRaw = params.get('from') || params.get('sender') || '';
      } catch { rawSms = ''; }
    }

    if (!rawSms) {
      return NextResponse.json({ success: false, message: 'No SMS text found' }, { status: 400 });
    }

    // 3. CLEAN SMS TEXT
    // Remove common forwarder app prefixes
    let cleanSms = rawSms
      .replace(/^From\s*:\s*[^\s]*\([^)]*\)\s*/i, '')
      .replace(/^From\s*:\s*\S+\s*/i, '')
      .trim();
    if (cleanSms.length < 10) cleanSms = rawSms;

    // 4. LOG RAW SMS FOR DEBUGGING
    await db.ref('/sms_raw_log').push({
      raw: rawSms,
      cleaned: cleanSms,
      sender: senderRaw,
      receivedAt: Date.now()
    });

    // 5. VALIDATE EVC PLUS TEMPLATE
    const isEvc = cleanSms.includes('EVCPLUS') || cleanSms.includes('EVC') || cleanSms.includes('waxaad') || cleanSms.includes('ka heshay');
    if (!isEvc) {
      return NextResponse.json({ success: true, matched: false, message: 'Non-EVC SMS ignored' });
    }

    // 6. EXTRACT PAYMENT DETAILS
    const amountMatch = cleanSms.match(/\$\s*([0-9]+\.?[0-9]*)\s+ka\s+heshay/i);
    if (!amountMatch) {
      await db.ref('/sms_payments').push({ raw: cleanSms, senderPhone: null, amount: null, receivedAt: Date.now(), matched: false, error: 'No amount', expired: false });
      return NextResponse.json({ success: false, message: 'Could not extract amount' });
    }
    const amount = parseFloat(amountMatch[1]);

    const phoneMatch = cleanSms.match(/ka\s+heshay\s+([\+0-9]+)/i);
    if (!phoneMatch) {
      await db.ref('/sms_payments').push({ raw: cleanSms, senderPhone: null, amount, receivedAt: Date.now(), matched: false, error: 'No phone', expired: false });
      return NextResponse.json({ success: false, message: 'Could not extract phone' });
    }

    // Normalize phone to 9 digits starting with 6
    let phone = phoneMatch[1].replace(/^\+252/, '').replace(/^252/, '').replace(/^0/, '').replace(/\s/g, '');
    if (!/^6[0-9]{8}$/.test(phone)) {
      const altMatch = cleanSms.match(/\b(6[0-9]{8})\b/);
      if (altMatch) phone = altMatch[1];
      else return NextResponse.json({ success: false, message: `Invalid phone: ${phone}` });
    }

    const now = Date.now();
    const smsRef = db.ref('/sms_payments').push();
    await smsRef.set({ raw: cleanSms, senderPhone: phone, amount, receivedAt: now, matched: false, matchedOrderId: null, expired: false });
    const smsId = smsRef.key;

    // 7. MATCH PENDING ORDERS
    const ordersSnap = await db.ref('/orders').get();
    if (!ordersSnap.exists()) return NextResponse.json({ success: true, smsId, matched: false, message: 'No orders found' });

    const allOrders = ordersSnap.val();
    const twoHours = 2 * 60 * 60 * 1000;
    const pendingStatuses = ['pending', 'waiting', 'waiting_payment', 'unpaid', 'new', 'created'];

    const matchingOrders = Object.entries(allOrders)
      .filter(([id, order]: [string, any]) => {
        const status = (order.status || '').toLowerCase();
        if (!pendingStatuses.includes(status)) return false;
        if (order.smsMatchedId) return false;

        const rawOrderPhone = (order.gameDetails?.senderNumber || order.userPhone || order.senderPhone || '').toString();
        const normalizedOrderPhone = rawOrderPhone.replace(/^\+252/, '').replace(/^252/, '').replace(/^0/, '').replace(/\s/g, '').replace(/[^0-9]/g, '');
        
        const orderPhone9 = normalizedOrderPhone.slice(-9);
        const smsPhone9 = phone.slice(-9);

        const phoneMatch = orderPhone9 === smsPhone9 || normalizedOrderPhone === phone;
        const orderAmount = parseFloat(order.total || order.amount || 0);
        const amountMatch = Math.abs(orderAmount - amount) < 0.02;

        const orderTime = order.createdAt || order.placedAt || 0;
        return phoneMatch && amountMatch && Math.abs(now - orderTime) <= twoHours;
      })
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0)); // Oldest order first

    if (matchingOrders.length === 0) return NextResponse.json({ success: true, smsId, matched: false, phone, amount, message: 'SMS saved. No matching pending order.' });

    // 8. EXECUTE APPROVAL
    const [matchedOrderId, matchedOrder]: [string, any] = matchingOrders[0];
    await db.ref(`/sms_payments/${smsId}`).update({ matched: true, matchedOrderId });
    await db.ref(`/orders/${matchedOrderId}`).update({ 
      status: 'successful', 
      paymentMatchedAt: now, 
      smsMatchedId: smsId, 
      approvedBy: 'auto_sms', 
      approvedAt: now, 
      completedAt: now 
    });

    // 9. TRIGGER RESELLER AUTOMATION
    const itemId = matchedOrder.items?.[0]?.id || matchedOrder.itemId;
    if (itemId) {
      const itemSnap = await db.ref(`/products/${itemId}`).get();
      const item = itemSnap.val();
      if (item?.autoTopupEnabled || item?.category === 'special_package') {
        const endpoint = item.category === 'special_package' ? '/api/fazercards/place-special-package' : '/api/fazercards/place-topup';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so';
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
        }).catch(err => console.error('Automation trigger error:', err));
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
        message: `💳 Auto-approved via SMS match! Phone: ${phone}, Amount: $${amount}`
      })
    }).catch(() => {});

    return NextResponse.json({ 
      success: true, 
      matched: true, 
      matchedOrderId, 
      phone, 
      amount, 
      message: `Order #${matchedOrderId.toUpperCase()} auto-approved.` 
    });

  } catch (err: any) {
    console.error('SMS Webhook Critical Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
