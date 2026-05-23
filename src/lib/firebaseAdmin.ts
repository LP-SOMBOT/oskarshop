import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK initialization for server-side logic (API Routes).
 * Includes robust checks to prevent crashes if environment variables are missing.
 */

const getServiceAccount = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
};

const serviceAccount = getServiceAccount();

if (!getApps().length && serviceAccount) {
  try {
    initializeApp({
      credential: cert(serviceAccount as any),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const adminDb = serviceAccount ? getDatabase() : null;
export const adminAuth = serviceAccount ? getAuth() : null;
export const isFirebaseAdminAvailable = !!(adminDb && adminAuth);
