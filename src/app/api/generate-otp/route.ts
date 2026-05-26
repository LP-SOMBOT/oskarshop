
import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

/**
 * API Route to generate and store OTP.
 * Path: /api/generate-otp
 * Handles: 
 * - 'signup': Verifies email/phone uniqueness and generates OTP.
 * - 'reset': Finds associated email for a phone and generates OTP.
 */

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminAvailable || !adminDb) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin not configured.' 
      }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, phone, type } = body;

    if (type === 'signup') {
      if (!email || !phone) {
        return NextResponse.json({ success: false, message: 'Email and Phone are required' }, { status: 400 });
      }

      // Check if email or phone exists
      const usersRef = adminDb.ref('users');
      const usersSnapshot = await usersRef.get();
      const allUsers = usersSnapshot.val() || {};
      
      const normalizedPhone = phone.replace(/\D/g, "");
      const exists = Object.values(allUsers).some((u: any) => {
        const uPhone = (u.phoneNumber || "").replace(/\D/g, "");
        return uPhone === normalizedPhone || u.email === email;
      });

      if (exists) {
        return NextResponse.json({ success: false, message: 'Account-kan horay ayaa loo diiwaan geliyay.' }, { status: 400 });
      }
    }

    if (type === 'reset') {
      if (!phone) {
        return NextResponse.json({ success: false, message: 'Phone is required' }, { status: 400 });
      }

      const usersRef = adminDb.ref('users');
      const usersSnapshot = await usersRef.get();
      const allUsers = usersSnapshot.val() || {};
      
      const normalizedPhone = phone.replace(/\D/g, "");
      const user: any = Object.values(allUsers).find((u: any) => (u.phoneNumber || "").replace(/\D/g, "") === normalizedPhone);

      if (!user || !user.email) {
        return NextResponse.json({ success: false, message: 'Account-kan lama helin.' }, { status: 404 });
      }

      // Use the user's real email for the OTP
      return generateAndSaveOtp(user.email);
    }

    // Default: signup verification or direct email OTP
    return generateAndSaveOtp(email);

  } catch (error: any) {
    console.error('Generate OTP Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

async function generateAndSaveOtp(email: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const sanitizedIdentifier = email.replaceAll('.', ',');
  const expiresAt = Date.now() + 600000; // 10 minutes

  await adminDb.ref(`otp_codes/${sanitizedIdentifier}`).set({
    otp,
    expiresAt,
    used: false
  });

  return NextResponse.json({ success: true, otp, targetEmail: email });
}
