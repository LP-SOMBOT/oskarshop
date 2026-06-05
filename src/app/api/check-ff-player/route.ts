
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
    const res = await fetch(
      `https://ff-info-api-xyz.vercel.app/api/Flex-ff-Info?region=${region.toUpperCase()}&uid=${uid.trim()}`,
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

    if (data?.basicInfo?.nickname) {
      return NextResponse.json({
        success: true,
        nickname: data.basicInfo.nickname,
        level: data.basicInfo.level || null,
        region: data.basicInfo.region || region,
        likes: data.basicInfo.liked || null,
        clan: data.clanBasicInfo?.clanName || null,
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
