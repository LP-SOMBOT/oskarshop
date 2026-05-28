import { NextResponse } from 'next/server';

/**
 * OneSignal Notification Proxy
 * 
 * Sends push notifications via OneSignal REST API.
 * Supports targeting by external_id (single user) or tags (multiple admins).
 */
export async function POST(request: Request) {
  try {
    const { title, body, targetUid, isAdminOnly } = await request.json();

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restKey) {
      return NextResponse.json({ error: 'OneSignal not configured' }, { status: 500 });
    }

    const payload: any = {
      app_id: appId,
      headings: { en: title },
      contents: { en: body },
      // Optional: Add data for deep linking
      data: { 
        linkTo: isAdminOnly ? '/admin' : '/#notifications' 
      }
    };

    if (isAdminOnly) {
      // Target all users with the isAdmin tag
      payload.filters = [
        { field: "tag", key: "isAdmin", relation: "=", value: "true" }
      ];
    } else if (targetUid) {
      // Target a specific user by their external ID (Firebase UID)
      payload.include_external_user_ids = [targetUid];
    } else {
      return NextResponse.json({ error: 'No target specified' }, { status: 400 });
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${restKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('OneSignal API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
