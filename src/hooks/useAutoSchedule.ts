
'use client';
import { useEffect, useRef } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { useDatabase } from '@/firebase';

/**
 * useAutoSchedule Hook
 * Monitors the current time in Africa/Mogadishu and automatically toggles
 * the shop's offline/online status based on scheduled hours.
 * 
 * Logic: Checks if current time is WITHIN the opening window.
 * If not, it sets the shop to offline.
 * 
 * Evaluates every 3 seconds for high precision.
 */
export function useAutoSchedule() {
  const rtdb = useDatabase();
  const scheduleRef = useRef<any>(null);

  useEffect(() => {
    if (!rtdb) return;

    const dbScheduleRef = ref(rtdb, 'settings/schedule');
    
    const unsub = onValue(dbScheduleRef, (snapshot) => {
      scheduleRef.current = snapshot.val();
      // Trigger an immediate check when settings change
      checkSchedule();
    });

    const checkSchedule = async () => {
      const schedule = scheduleRef.current;
      if (!schedule || !schedule.enabled || !schedule.openTime || !schedule.closeTime) return;

      // Get Mogadishu Time
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Mogadishu',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const mogadishuTime = formatter.format(now);

      const [currH, currM] = mogadishuTime.split(':').map(Number);
      const currentTotalMins = currH * 60 + currM;

      const [openH, openM] = schedule.openTime.split(':').map(Number);
      const openTotalMins = openH * 60 + openM;

      const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
      const closeTotalMins = closeH * 60 + closeM;

      let shouldBeOnline = false;

      // If Open and Close are the same, treat as always closed to be safe
      if (openTotalMins === closeTotalMins) {
        shouldBeOnline = false;
      } else if (openTotalMins < closeTotalMins) {
        // Standard window (e.g., 07:00 to 22:00)
        shouldBeOnline = currentTotalMins >= openTotalMins && currentTotalMins < closeTotalMins;
      } else {
        // Over-midnight window (e.g., 22:00 to 07:00)
        shouldBeOnline = currentTotalMins >= openTotalMins || currentTotalMins < closeTotalMins;
      }

      // Read current actual shop status to prevent unnecessary writes
      try {
        const appStatusRef = ref(rtdb, 'settings/appStatus');
        const statusSnap = await get(appStatusRef);
        const currentOffline = statusSnap.val()?.offline;

        // Force switch based on window logic
        if (shouldBeOnline && currentOffline === true) {
          // Within open hours but app is offline -> Force Online
          await update(appStatusRef, { offline: false });
        } 
        else if (!shouldBeOnline && currentOffline === false) {
          // Outside open hours but app is online -> Force Offline
          await update(appStatusRef, { offline: true });
        }
      } catch (err) {
        console.error("AutoSchedule: Failed to sync status", err);
      }
    };

    // Run check every 3 seconds for extremely high responsiveness
    const interval = setInterval(checkSchedule, 3000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [rtdb]);
}
