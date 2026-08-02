
import { NextResponse } from 'next/server';

/**
 * GET: Fetches available top-up categories from FazerCards.
 */
export async function GET() {
  try {
    const apiKey = process.env.FAZERCARDS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Not Configured' }, { status: 500 });

    const res = await fetch('https://api.fzr.cards/api/v2/topups?limit=100', {
      headers: { 'X-API-Key': apiKey }
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
