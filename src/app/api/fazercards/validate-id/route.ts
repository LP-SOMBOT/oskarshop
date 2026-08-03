
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST: Validates a Player ID using FazerCards API.
 * Uses the API key stored in Realtime Database.
 * Endpoint: https://api.fzr.cards/api/v2/topups/validate-id
 */
export async function POST(request: Request) {
  try {
    const { category_id, player_id } = await request.json();

    if (!category_id || !player_id) {
      return NextResponse.json({ ok: false, error: 'Category ID and Player ID are required' }, { status: 400 });
    }

    // Fetch API Key from database
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const config = settingsSnap.val();
    const apiKey = config?.apiKey;

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'FazerCards API Key not configured in Admin Settings' }, { status: 500 });
    }

    const res = await fetch('https://api.fzr.cards/api/v2/topups/validate-id', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category_id,
        fields: {
          player_id: player_id.toString()
        }
      })
    });

    const data = await res.json();

    // 422 means ID could not be confirmed — we pass this back to UI
    if (res.status === 422) {
      return NextResponse.json({ 
        ok: false, 
        error: 'ID-gaan lama xaqiijin karo, fadlan iska hubi.', 
        code: 422 
      });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('FazerCards Validation Error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
