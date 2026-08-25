import { adminDb } from '@/lib/firebaseAdmin'
import { processOrderFazerTopup } from '@/lib/fazercards'

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    status: 'READY AND ACTIVE',
    message: 'OskarShop SMS Webhook online',
    usage: 'POST /api/sms-webhook'
  })
}

export async function POST(request: Request) {
  const now = Date.now()

  // Read raw body as text - accept everything
  const rawBody = await request.text().catch(() => '')

  // Parse SMS text from body
  let smsText = rawBody
  const ct = request.headers.get('content-type') || ''

  if (ct.includes('json') && rawBody) {
    try {
      const j = JSON.parse(rawBody)
      smsText = j.sms || j.msg || j.message ||
                j.text || j.body || j.data || rawBody
    } catch { smsText = rawBody }
  } else if (ct.includes('form') && rawBody) {
    try {
      const p = new URLSearchParams(rawBody)
      smsText = p.get('sms') || p.get('msg') ||
                p.get('message') || p.get('text') || rawBody
    } catch { smsText = rawBody }
  }

  // Strip forwarder prefix "From : 192() message"
  smsText = smsText
    .replace(/^From\s*:\s*[^\n]*\n?/im, '')
    .trim()
  if (!smsText) smsText = rawBody

  // Always log to Firebase - even empty bodies
  try {
    await adminDb.ref('/sms_raw_log').push({
      rawBody: rawBody.substring(0, 500),
      smsText: smsText.substring(0, 500),
      contentType: ct,
      receivedAt: now
    })
  } catch (e: any) {
    // If Firebase fails, still return 200
    return Response.json({
      ok: true,
      received: true,
      firebaseError: e.message,
      smsText: smsText.substring(0, 100)
    })
  }

  // Check if EVC Plus
  const isEvc = smsText.includes('EVCPLUS') ||
                smsText.includes('EVC') ||
                smsText.includes('ka heshay') ||
                smsText.includes('waxaad')

  if (!isEvc) {
    return Response.json({
      ok: true,
      received: true,
      isEvc: false,
      message: 'Non-EVC SMS logged and ignored'
    })
  }

  // Extract amount
  const amountMatch = smsText.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/) ||
                      smsText.match(/([0-9]+(?:\.[0-9]+)?)\s*\$/)
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null

  // Extract phone after "ka heshay"
  let phone: string | null = null
  const phoneMatch = smsText.match(/ka\s+heshay\s+([\+0-9]+)/i)
  if (phoneMatch) {
    phone = phoneMatch[1]
      .replace(/^\+252/, '')
      .replace(/^252/, '')
      .replace(/^0/, '')
      .replace(/[^0-9]/g, '')
  }
  if (!phone || phone.length < 8) {
    const fallback = smsText.match(/\b(?:252|0)?(6[0-9]{8})\b/) || smsText.match(/\b(6[0-9]{7,8})\b/)
    if (fallback) phone = fallback[1]
  }

  if (!phone || !amount) {
    return Response.json({
      ok: true,
      received: true,
      isEvc: true,
      phone,
      amount,
      message: 'EVC SMS logged. Could not extract phone or amount.'
    })
  }

  // Save SMS payment record
  const smsRef = adminDb.ref('/sms_payments').push()
  await smsRef.set({
    raw: smsText,
    senderPhone: phone,
    amount,
    receivedAt: now,
    matched: false,
    matchedOrderId: null,
    expired: false
  })
  const smsId = smsRef.key

  // Find matching pending order
  const ordersSnap = await adminDb.ref('/orders').get()
  if (!ordersSnap.exists()) {
    return Response.json({
      ok: true,
      received: true,
      smsId,
      phone,
      amount,
      matched: false,
      message: 'SMS saved. No orders in database.'
    })
  }

  const allOrders = ordersSnap.val() as Record<string, any>
  const twoHours = 2 * 60 * 60 * 1000
  const pendingStatuses = [
    'pending', 'waiting', 'waiting_payment',
    'unpaid', 'new', 'created'
  ]

  const matches = Object.entries(allOrders)
    .filter(([, order]) => {
      if (!order || order.smsMatchedId) return false
      const status = (order.status || '').toLowerCase()
      if (!pendingStatuses.includes(status)) return false

      const rawPhone = String(
        order.senderPhone ||
        order.customerPhone ||
        order.phone ||
        order.paymentPhone ||
        order.gameDetails?.senderNumber ||
        order.gameDetails?.whatsappNumber ||
        order.userPhone || ''
      )
      const normPhone = rawPhone
        .replace(/^\+252/, '')
        .replace(/^252/, '')
        .replace(/^0/, '')
        .replace(/[^0-9]/g, '')
        .slice(-9)

      const phoneOk = normPhone === phone!.slice(-9)
      const orderAmount = parseFloat(
        order.amount || order.total || order.price || '0'
      )
      const amountOk = Math.abs(orderAmount - amount!) < 0.02
      const orderTime = order.createdAt || order.placedAt || 0
      const timeOk = Math.abs(now - orderTime) <= twoHours

      return phoneOk && amountOk && timeOk
    })
    .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0))

  if (matches.length === 0) {
    return Response.json({
      ok: true,
      received: true,
      smsId,
      phone,
      amount,
      matched: false,
      message: 'SMS saved. No matching orders found.'
    })
  }

  // Match first pending order
  const [matchedOrderId, matchedOrder] = matches[0]

  await adminDb.ref(`/sms_payments/${smsId}`).update({
    matched: true,
    matchedOrderId
  })

  // Set order status to processing (standard lifecycle: pending -> processing -> successful/cancelled)
  await adminDb.ref(`/orders/${matchedOrderId}`).update({
    status: 'processing',
    paymentMatchedAt: now,
    smsMatchedId: smsId,
    approvedBy: 'auto_sms',
    processedAt: now,
    approvedAt: now
  })

  // Check if Reseller Automation FazerCards is enabled in admin settings
  let resellerResult: any = null
  try {
    const settingsSnap = await adminDb.ref('settings/fazercards').get()
    const fazerConfig = settingsSnap.val()
    if (fazerConfig?.enabled) {
      resellerResult = await processOrderFazerTopup(matchedOrderId)
    }
  } catch (err: any) {
    console.error('Error invoking FazerCards for matched order:', err)
  }

  // Telegram notification
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oskarshop.so'
  fetch(`${appUrl}/api/notify-telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: matchedOrder.customerName ||
        matchedOrder.gameDetails?.playerName || 'User',
      customerPhone: matchedOrder.customerPhone ||
        matchedOrder.gameDetails?.whatsappNumber || phone,
      itemName: matchedOrder.itemName ||
        matchedOrder.items?.[0]?.title || 'Item',
      amount: matchedOrder.amount ||
        matchedOrder.total || amount,
      orderId: matchedOrderId,
      message: `💳 Auto-matched via SMS! Status: PROCESSING. Phone: ${phone} Amount: $${amount}`
    })
  }).catch(() => {})

  return Response.json({
    ok: true,
    received: true,
    smsId,
    phone,
    amount,
    matched: true,
    matchedOrderId,
    status: 'processing',
    resellerResult,
    message: `Order ${matchedOrderId} matched and set to processing.`
  })
}
