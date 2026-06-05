
import { NextResponse } from 'next/server';

/**
 * API Proxy Route for Free Fire Player Lookup
 * Proteced server-side route to prevent leaking external API details.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  const region = searchParams.get('region') || 'ME';

  if (!uid || uid.trim().length < 5) {
    return NextResponse.json(
      { success: false, message: 'Invalid UID' },
      { status: 400 }
    );
  }

  try {
    // Updated API endpoint provided by user
    const res = await fetch(
      `https://ff-info-api-oskar.vercel.app/api/player?uid=${uid.trim()}&region=${region.toUpperCase()}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: 'Player not found' },
        { status: 404 }
      );
    }

    const data = await res.json();

    // Extracting AccountName as requested (checking both root and nested structures)
    const nickname = data?.AccountName || data?.AccountInfo?.AccountName;

    if (nickname) {
      return NextResponse.json({
        success: true,
        nickname: nickname,
        level: data?.AccountLevel || data?.AccountInfo?.AccountLevel || null,
        region: data?.AccountRegion || data?.AccountInfo?.AccountRegion || region,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Player not found. Check UID or region.' },
      { status: 404 }
    );
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { success: false, message: 'Lookup failed. Please try again.' },
      { status: 500 }
    );
  }
}
