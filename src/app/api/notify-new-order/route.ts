
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Notification Route
 * Uses OneSignal tags to target all administrators.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, itemTitle } = await req.json();

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        filters: [
          { field: "tag", key: "isAdmin", relation: "=", value: "true" }
        ],
        headings: { en: '🛒 Dalabka cusub!' },
        contents: { en: `Macmiil ayaa dalbaday ${itemTitle || 'item'}. Order ID: #${orderId?.toUpperCase()}` },
        url: '/admin',
        chrome_web_icon: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
      }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('New order notify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
