
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * GET: Fetches available top-up categories from FazerCards.
 */
export async function GET() {
  try {
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const apiKey = settingsSnap.val()?.apiKey;

    if (!apiKey) return NextResponse.json({ error: 'FazerCards API Key not configured' }, { status: 500 });

    const res = await fetch('https://api.fzr.cards/api/v2/topups?limit=100', {
      headers: { 'X-API-Key': apiKey }
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
