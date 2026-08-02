
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * GET: Fetches offers for a specific category ID.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');

    if (!category_id) return NextResponse.json({ error: 'Category ID required' }, { status: 400 });

    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;

    if (!apiKey) return NextResponse.json({ error: 'FazerCards API Key not configured' }, { status: 500 });

    const res = await fetch(`https://api.fzr.cards/api/v2/topups/offers?category_id=${category_id}`, {
      headers: { 'X-API-Key': apiKey }
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
