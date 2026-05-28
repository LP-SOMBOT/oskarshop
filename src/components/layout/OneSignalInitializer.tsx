'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';

/**
 * OneSignalInitializer
 * 
 * Handles the client-side setup for OneSignal v16.
 * Syncs the current user's UID and role with OneSignal tags for targeting.
 */
export default function OneSignalInitializer() {
  const { user } = useApp();
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initOneSignal = async () => {
      const OneSignal = (window as any).OneSignal;
      if (!OneSignal) return;

      if (!initialized.current) {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          safari_web_id: "web.onesignal.auto.5460a967-902f-480f-be25-7a4d963d753c",
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
        });
        initialized.current = true;
      }

      if (user) {
        // Log the user into OneSignal using their Firebase UID
        await OneSignal.login(user.uid);
        
        // Tag the user for segmentation (e.g., sending pushes to all admins)
        await OneSignal.User.addTag("role", user.role || "user");
        await OneSignal.User.addTag("isAdmin", user.isAdmin ? "true" : "false");
        
        console.log("OneSignal: User synced", user.uid);
      } else {
        await OneSignal.logout();
      }
    };

    // OneSignal loads via script tag in layout.tsx
    // We check periodically if the SDK is ready
    const checkInterval = setInterval(() => {
      if ((window as any).OneSignal) {
        clearInterval(checkInterval);
        initOneSignal();
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [user]);

  return null;
}
