import { NextResponse } from 'next/server';
import { executeFazerTopup } from '@/lib/fazercards';

/**
 * POST: Places a top-up order on FazerCards.
 * Path: /api/fazercards/place-topup
 */
export async function POST(request: Request) {
  try {
    const { orderId, category_id, offer_id, fields } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const result = await executeFazerTopup({
      orderId,
      category_id,
      offer_id,
      fields
    });

    if (result.alreadyProcessed) {
      return NextResponse.json(result, { status: 200 });
    }

    if (!result.success) {
      const status = result.error?.includes('disabled') ? 403 : result.error?.includes('missing') ? 500 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('FazerCards dynamic top-up route error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
