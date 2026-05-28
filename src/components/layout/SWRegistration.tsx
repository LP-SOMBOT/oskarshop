'use client';

import { useEffect } from 'react';

/**
 * SWRegistration Component
 * Registers the Service Workers on the client side.
 * This is essential for the PWA to be considered installable by browsers.
 */
export default function SWRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register main PWA Service Worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('OskarShop SW registered:', registration.scope);
        })
        .catch((error) => {
          console.error('OskarShop SW registration failed:', error);
        });

      // Register OneSignal Worker separately if needed by SDK logic
      // Note: OneSignal usually handles its own registration, but having 
      // the file accessible in public/ is the primary requirement.
    }
  }, []);

  return null;
}
