
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generic OneSignal Notification Route
 * Targets specific users by their External ID (Firebase UID).
 */
export async function POST(req: NextRequest) {
  try {
    const { targetUids, title, message, url } = await req.json();

    if (!targetUids || targetUids.length === 0) {
      return NextResponse.json({ error: 'No target UIDs provided' }, { status: 400 });
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_external_user_ids: targetUids,
        headings: { en: title },
        contents: { en: message },
        url: url || '/',
        chrome_web_icon: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
      }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Notify API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
