'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Database } from 'firebase/database';
import { Messaging } from 'firebase/messaging';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  rtdb: Database;
  messaging: Messaging | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ 
  children, 
  app, 
  auth, 
  db,
  rtdb,
  messaging
}: { 
  children: React.ReactNode; 
  app: FirebaseApp; 
  auth: Auth; 
  db: Firestore;
  rtdb: Database;
  messaging: Messaging | null;
}) {
  return (
    <FirebaseContext.Provider value={{ app, auth, db, rtdb, messaging }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
}

export function useFirebaseApp() {
  return useFirebase().app;
}

export function useFirestore() {
  return useFirebase().db;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useDatabase() {
  return useFirebase().rtdb;
}
