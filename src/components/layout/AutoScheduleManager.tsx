'use client';
import { useAutoSchedule } from '@/hooks/useAutoSchedule';

/**
 * Global Manager for the Auto Schedule logic.
 * This component runs the hook and ensures it is active as long as the app is open.
 */
export default function AutoScheduleManager() {
  useAutoSchedule();
  return null;
}
