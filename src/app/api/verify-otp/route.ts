import { NextResponse } from 'next/server';
import { adminDb, adminAuth, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

/**
 * API Route to verify OTP and reset password.
 * Path: /api/verify-otp
 */

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminAvailable || !adminDb || !adminAuth) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin not configured. Please set environment variables.' 
      }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing mandatory data' }, { status: 400 });
    }

    const sanitizedEmail = email.replaceAll('.', ',');
    const otpRef = adminDb.ref(`otp_codes/${sanitizedEmail}`);
    const snap = await otpRef.get();

    if (!snap.exists()) {
      return NextResponse.json({ success: false, message: 'No OTP request found. Please request a new code.' }, { status: 404 });
    }

    const record = snap.val();

    if (record.used) {
      return NextResponse.json({ success: false, message: 'Code already used.' }, { status: 400 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Incorrect code.' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      return NextResponse.json({ success: false, message: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    // Find user UID
    const usersRef = adminDb.ref('users');
    const userSnapshot = await usersRef.orderByChild('email').equalTo(email).get();
    
    if (!userSnapshot.exists()) {
      return NextResponse.json({ success: false, message: 'User record not found.' }, { status: 404 });
    }

    const userData = userSnapshot.val();
    const uid = Object.keys(userData)[0];

    // Update Firebase Auth password
    await adminAuth.updateUser(uid, { password: newPassword });

    // Mark as used
    await otpRef.update({ used: true });

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
