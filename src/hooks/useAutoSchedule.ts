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

    const interval = setInterval(() => {
      if (!schedule || !schedule.enabled || !schedule.openTime || !schedule.closeTime) return;

      const now = new Date();
      // Use 24h format for comparison
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

      if (isCloseTime) {
        // Trigger switch to offline
        update(ref(rtdb, 'settings/appStatus'), { offline: true });
        update(ref(rtdb, 'settings/schedule'), { currentStatus: 'closed' });
      } else if (isOpenTime) {
        // Trigger switch to online
        update(ref(rtdb, 'settings/appStatus'), { offline: false });
        update(ref(rtdb, 'settings/schedule'), { currentStatus: 'open' });
      }
    }, 30000); // Check every 30 seconds

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [rtdb]);
}
