
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * GET: Fetches current FazerCards wallet balance.
 * Uses the API key stored in Realtime Database.
 */
export async function GET() {
  try {
    // Fetch settings from database
    const settingsSnap = await adminDb.ref('settings/fazercards').get();
    const config = settingsSnap.val();
    const apiKey = config?.apiKey;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'FazerCards API Key not configured in Admin Settings' }, { status: 500 });
    }

    const res = await fetch('https://api.fzr.cards/api/v2/balance', {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Ensure live data
    });

    const data = await res.json();

    if (data.ok) {
      // Sync balance string with Firebase for admin display
      await adminDb.ref('settings/fazercards').update({
        balance: `${data.balance} ${data.currency}`,
        lastBalanceCheck: Date.now()
      });

      return NextResponse.json({
        success: true,
        balance: data.balance,
        currency: data.currency
      });
    }

    return NextResponse.json({ success: false, error: data.error || 'API request failed' }, { status: 400 });
  } catch (err: any) {
    console.error('FazerCards Balance Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
