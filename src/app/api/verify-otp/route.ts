
import { NextResponse } from 'next/server';
import { adminDb, adminAuth, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

/**
 * API Route to verify OTP and reset password.
 * Path: /api/verify-otp
 * Updated for Phone-to-SyntheticEmail mapping logic.
 */

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminAvailable || !adminDb || !adminAuth) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin not configured. Please check your admin SDK settings.' 
      }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing mandatory data' }, { status: 400 });
    }

    const sanitizedIdentifier = email.replaceAll('.', ',');
    const otpRef = adminDb.ref(`otp_codes/${sanitizedIdentifier}`);
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

    // Find user UID using manual search to avoid index requirement
    const usersRef = adminDb.ref('users');
    const usersSnapshot = await usersRef.get();
    const allUsers = usersSnapshot.val() || {};
    
    const userEntry = Object.entries(allUsers).find(([_, u]: any) => u.email === email);
    
    if (!userEntry) {
      return NextResponse.json({ success: false, message: 'User record not found.' }, { status: 404 });
    }

    const uid = userEntry[0];

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
