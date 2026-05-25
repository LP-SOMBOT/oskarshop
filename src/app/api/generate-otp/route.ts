
import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

/**
 * API Route to generate and store OTP.
 * Path: /api/generate-otp
 * Updated to handle both email and phone-based identifiers.
 */

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminAvailable || !adminDb) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin not configured. Please check your admin SDK settings.' 
      }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Identifier is required' }, { status: 400 });
    }

    // 1. Verify user exists in /users/
    const usersRef = adminDb.ref('users');
    const usersSnapshot = await usersRef.get();
    const allUsers = usersSnapshot.val() || {};
    
    const userExists = Object.values(allUsers).some((u: any) => u.email === email);

    if (!userExists) {
      return NextResponse.json({ success: false, message: 'Account-kan lama helin. Fadlan iska hubi numbarka.' }, { status: 404 });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sanitizedIdentifier = email.replaceAll('.', ',');
    const expiresAt = Date.now() + 600000; // 10 minutes

    // 3. Save to /otp_codes/
    await adminDb.ref(`otp_codes/${sanitizedIdentifier}`).set({
      otp,
      expiresAt,
      used: false
    });

    return NextResponse.json({ success: true, otp });
  } catch (error: any) {
    console.error('Generate OTP Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
