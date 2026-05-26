
import { NextResponse } from 'next/server';
import { adminDb, adminAuth, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

/**
 * API Route to verify OTP.
 * Path: /api/verify-otp
 * Supports verification only (for signup) or verification + password reset.
 */

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminAvailable || !adminDb || !adminAuth) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin not configured.' 
      }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, otp, newPassword, isReset } = body;

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Missing mandatory data' }, { status: 400 });
    }

    const sanitizedIdentifier = email.replaceAll('.', ',');
    const otpRef = adminDb.ref(`otp_codes/${sanitizedIdentifier}`);
    const snap = await otpRef.get();

    if (!snap.exists()) {
      return NextResponse.json({ success: false, message: 'No OTP request found.' }, { status: 404 });
    }

    const record = snap.val();

    if (record.used) {
      return NextResponse.json({ success: false, message: 'Code already used.' }, { status: 400 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Incorrect code.' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      return NextResponse.json({ success: false, message: 'Code expired.' }, { status: 400 });
    }

    // Mark as used
    await otpRef.update({ used: true });

    // If it's a reset, update the password in Firebase Auth
    if (isReset && newPassword) {
      const usersRef = adminDb.ref('users');
      const usersSnapshot = await usersRef.get();
      const allUsers = usersSnapshot.val() || {};
      
      const userEntry = Object.entries(allUsers).find(([_, u]: any) => u.email === email);
      
      if (!userEntry) {
        return NextResponse.json({ success: false, message: 'User record not found.' }, { status: 404 });
      }

      const uid = userEntry[0];
      await adminAuth.updateUser(uid, { password: newPassword });
    }

    return NextResponse.json({ success: true, message: 'Verification successful.' });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
