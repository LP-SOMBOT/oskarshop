
import { NextResponse } from 'next/server';

/**
 * GET: Fetches offers for a specific category ID.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');

    if (!category_id) return NextResponse.json({ error: 'Category ID required' }, { status: 400 });

    const apiKey = process.env.FAZERCARDS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Not Configured' }, { status: 500 });

    const res = await fetch(`https://api.fzr.cards/api/v2/topups/offers?category_id=${category_id}`, {
      headers: { 'X-API-Key': apiKey }
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
