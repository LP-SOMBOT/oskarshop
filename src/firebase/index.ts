'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;
let messaging: Messaging | null = null;

export async function initializeFirebase() {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
  
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
  }
  
  return { app, auth, db, rtdb, messaging };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth, useDatabase } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

export function useMessaging() {
  const context = useFirebase();
  return context.messaging;
}
