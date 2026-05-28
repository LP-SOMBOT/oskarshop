
import { NextRequest, NextResponse } from 'next/server';

/**
 * Order Completion Notification Route
 * Specifically formatted for user order updates.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, userId, status } = await req.json();

    if (!userId || !orderId) {
      return NextResponse.json({ error: 'Missing mandatory data' }, { status: 400 });
    }

    const title = status === 'successful' ? '✅ Dalabkaagu waa la xaqiijiyey!' : '📦 Cusbooneysiin Dalabka';
    const message = status === 'successful' 
      ? `Dalabkaaga #${orderId.toUpperCase()} si guul leh ayuu u dhameystirmay. Mahadsanid!`
      : `Status-ka dalabkaaga #${orderId.toUpperCase()} waa la bedelay: ${status}`;

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_external_user_ids: [userId],
        headings: { en: title },
        contents: { en: message },
        url: '/#orders',
        chrome_web_icon: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
      }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Order complete notify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
