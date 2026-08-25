import { NextResponse } from 'next/server';
import { executeFazerSpecialPackage } from '@/lib/fazercards';

/**
 * POST: Places a sequential batch of top-up orders for a Special Package on FazerCards.
 * Path: /api/fazercards/place-special-package
 */
export async function POST(request: Request) {
  try {
    const { orderId, playerUid, playerRegion, gameFields } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const result = await executeFazerSpecialPackage({
      orderId,
      playerUid,
      playerRegion,
      gameFields
    });

    if (result.alreadyProcessed) {
      return NextResponse.json(result, { status: 200 });
    }

    if (!result.success) {
      const status = result.error?.includes('disabled') || result.error?.includes('missing') ? 403 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Special Package Execution Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}