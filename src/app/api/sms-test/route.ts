import { NextResponse } from 'next/server';

/**
 * Simple POST test route to verify connectivity.
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

export async function GET() {
  return NextResponse.json({ status: 'test endpoint ok' });
}
