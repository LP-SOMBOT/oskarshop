
import { NextResponse } from 'next/server';
import { adminAuth, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

/**
 * Admin-Only API Route to delete a user from Firebase Authentication.
 */
export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminAvailable || !adminAuth) {
      return NextResponse.json({ success: false, message: 'Admin SDK not initialized' }, { status: 500 });
    }

    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ success: false, message: 'User UID is required' }, { status: 400 });
    }

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true, message: 'User deleted from Auth successfully' });
  } catch (error: any) {
    console.error('Delete User Auth Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
