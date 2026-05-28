'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Database } from 'firebase/database';
import { Messaging } from 'firebase/messaging';

/**
 * FirebaseClientProvider
 * 
 * Handles early service initialization.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<{
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    rtdb: Database;
    messaging: Messaging | null;
  } | null>(null);

  useEffect(() => {
    initializeFirebase().then(s => setServices(s));
  }, []);

  if (!services) {
    return null;
  }

  return (
    <FirebaseProvider 
      app={services.app} 
      auth={services.auth} 
      db={services.db}
      rtdb={services.rtdb}
      messaging={services.messaging}
    >
      {children}
    </FirebaseProvider>
  );
}
