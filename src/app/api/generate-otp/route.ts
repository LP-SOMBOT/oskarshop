import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * API Route to generate and store OTP.
 * Path: /api/generate-otp
 */

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // 1. Verify user exists in /users/
    const usersRef = adminDb.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).get();

    if (!snapshot.exists()) {
      return NextResponse.json({ success: false, message: 'No account found with that email.' }, { status: 404 });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sanitizedEmail = email.replaceAll('.', ',');
    const expiresAt = Date.now() + 600000; // 10 minutes

    // 3. Save to /otp_codes/
    await adminDb.ref(`otp_codes/${sanitizedEmail}`).set({
      otp,
      expiresAt,
      used: false
    });

    return NextResponse.json({ success: true, otp });
  } catch (error: any) {
    console.error('Generate OTP Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
