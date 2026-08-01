'use client';
import { useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { useDatabase } from '@/firebase';

/**
 * useAutoSchedule Hook
 * Monitors the current time in Africa/Mogadishu and automatically toggles
 * the shop's offline/online status based on scheduled hours.
 */
export function useAutoSchedule() {
  const rtdb = useDatabase();

  useEffect(() => {
    if (!rtdb) return;

    const scheduleRef = ref(rtdb, 'settings/schedule');
    let schedule: any = null;

    const unsub = onValue(scheduleRef, (snapshot) => {
      schedule = snapshot.val();
    });

    const checkSchedule = () => {
      if (!schedule || !schedule.enabled || !schedule.openTime || !schedule.closeTime) return;

      // Always calculate using Africa/Mogadishu timezone
      const now = new Date();
      const mogadishuTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Mogadishu',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);

      const [currentHour, currentMin] = mogadishuTime.split(':').map(Number);
      const [openHour, openMin] = schedule.openTime.split(':').map(Number);
      const [closeHour, closeMin] = schedule.closeTime.split(':').map(Number);

      const isCloseTime = currentHour === closeHour && currentMin === closeMin;
      const isOpenTime = currentHour === openHour && currentMin === openMin;

      // We only update if a match is found to avoid fighting with manual overrides
      if (isCloseTime) {
        update(ref(rtdb, 'settings/appStatus'), { offline: true });
      } else if (isOpenTime) {
        update(ref(rtdb, 'settings/appStatus'), { offline: false });
      }
    };

    // Run check immediately and then every 30 seconds
    const initialCheck = setTimeout(checkSchedule, 2000);
    const interval = setInterval(checkSchedule, 30000);

    return () => {
      unsub();
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [rtdb]);
}
