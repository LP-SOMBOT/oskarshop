
import { NextResponse } from 'next/server';

/**
 * GET: Simple health check for the test endpoint.
 */
export async function GET() {
  return NextResponse.json({ status: 'test endpoint ok' });
}

/**
 * POST: Echo back whatever is received to verify POST connectivity.
 */
export async function POST(request: Request) {
  try {
    const body = await request.text().catch(() => 'empty');
    return NextResponse.json({
      success: true,
      received: body,
      timestamp: Date.now()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
