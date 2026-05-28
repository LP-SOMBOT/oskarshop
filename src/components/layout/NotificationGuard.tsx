'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, ShieldAlert, Loader2, Smartphone } from 'lucide-react';
import { isStandalone } from '@/lib/pwa-utils';
import { useApp } from '@/lib/context';

/**
 * NotificationGuard Component
 * 
 * CRITICAL RULE:
 * 1. ONLY active in Standalone PWA mode.
 * 2. In PWA mode, users MUST grant notification permission to access the app.
 * 3. On regular websites, it stays silent and lets users browse normally.
 */
export default function NotificationGuard({ children }: { children: React.ReactNode }) {
  const { refreshFcmToken } = useApp();
  const [status, setStatus] = useState<'loading' | 'request' | 'granted' | 'denied' | 'skip'>('loading');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Step 1: Check if we are in PWA mode
      const standalone = isStandalone();
      
      if (!standalone) {
        setStatus('skip');
        return;
      }

      // Step 2: Check browser support
      if (!('Notification' in window)) {
        setStatus('skip'); // Device doesn't support notifications
        return;
      }

      // Step 3: Check current permission
      const currentPermission = Notification.permission;
      if (currentPermission === 'granted') {
        setStatus('granted');
        refreshFcmToken();
      } else if (currentPermission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('request');
      }
    }
  }, [refreshFcmToken]);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          setStatus('granted');
          refreshFcmToken();
          new Notification("Notifications Enabled!", {
            body: "You'll now receive real-time updates from Oskar Shop.",
            icon: "https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O"
          });
        } else {
          setStatus('denied');
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-[100001] bg-white dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  // If not in PWA mode or already granted or unsupported, just show the app
  if (status === 'skip' || status === 'granted') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100001] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 overflow-y-auto">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-32 h-32 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-primary shadow-2xl border border-primary/5">
          <Bell className="w-16 h-16 animate-bounce" />
        </div>
      </div>
      
      <h2 className="text-4xl font-headline font-bold mb-4 text-slate-900 dark:text-white leading-tight">
        Stay in <br /> the Game
      </h2>
      
      <p className="text-muted-foreground dark:text-slate-400 max-w-xs mb-12 text-[16px] leading-relaxed">
        Enable notifications to receive instant diamond deliveries, flash sale alerts, and <strong>Live Rewards</strong> even when the app is closed.
      </p>
      
      <Button 
        onClick={requestPermission} 
        className="w-full max-w-[300px] h-16 rounded-[2rem] font-bold text-xl shadow-2xl shadow-primary/30 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white gap-3 border-none"
      >
        <Bell className="w-6 h-6" /> Allow Notifications
      </Button>

      <p className="mt-8 text-[11px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest flex items-center gap-2">
         <Smartphone className="w-3 h-3" /> Mandatory for Oskar Shop PWA
      </p>

      {status === 'denied' && (
        <div className="mt-12 p-6 bg-red-50 dark:bg-red-950/20 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 flex flex-col items-center gap-4 text-red-600 dark:text-red-400 max-w-sm animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6" />
            <span className="font-bold text-base">Action Required</span>
          </div>
          <p className="text-xs text-center leading-relaxed font-medium">
            Notifications are currently blocked. To continue using the app, please go to your device settings, allow notifications for Oskar Shop, and refresh.
          </p>
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-2xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100/50 mt-2 font-bold text-sm"
            onClick={() => window.location.reload()}
          >
            I've enabled them, Refresh Now
          </Button>
        </div>
      )}
    </div>
  );
}
