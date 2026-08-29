'use client';

import { useState, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { useAuthContext } from '@/contexts/auth-context';
import { useFamily } from '@/contexts/family-context';
import { Medication } from '@/firebase/firestore/medications';
import {
  scheduleMedicationReminders,
  scheduleAllMedicationReminders,
  rescheduleMedicationReminders,
  checkMissedMedications,
} from '@/lib/notification-scheduler';

export function useMedicationReminders() {
  const firestore = useFirestore();
  const { user } = useAuthContext();
  const { selectedMember: activeProfile } = useFamily();
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Schedule reminders for a specific medication
   */
  const scheduleReminders = useCallback(
    async (medication: Medication, daysAhead: number = 7): Promise<number> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required parameters');
      }

      setIsScheduling(true);
      setError(null);

      try {
        const notificationIds = await scheduleMedicationReminders(
          firestore,
          user.uid,
          activeProfile.id,
          medication,
          daysAhead
        );

        return notificationIds.length;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to schedule reminders';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsScheduling(false);
      }
    },
    [firestore, user, activeProfile]
  );

  /**
   * Schedule reminders for all active medications
   */
  const scheduleAllReminders = useCallback(
    async (daysAhead: number = 7): Promise<number> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required parameters');
      }

      setIsScheduling(true);
      setError(null);

      try {
        const count = await scheduleAllMedicationReminders(
          firestore,
          user.uid,
          activeProfile.id,
          daysAhead
        );

        return count;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to schedule reminders';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsScheduling(false);
      }
    },
    [firestore, user, activeProfile]
  );

  /**
   * Reschedule reminders for a medication (cancel old, create new)
   */
  const rescheduleReminders = useCallback(
    async (medication: Medication): Promise<void> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required parameters');
      }

      setIsScheduling(true);
      setError(null);

      try {
        await rescheduleMedicationReminders(
          firestore,
          user.uid,
          activeProfile.id,
          medication
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reschedule reminders';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsScheduling(false);
      }
    },
    [firestore, user, activeProfile]
  );

  /**
   * Check for missed medications and create follow-up notifications
   */
  const checkMissed = useCallback(async (): Promise<number> => {
    if (!firestore || !user || !activeProfile) {
      throw new Error('Missing required parameters');
    }

    setError(null);

    try {
      const notificationIds = await checkMissedMedications(
        firestore,
        user.uid,
        activeProfile.id
      );

      return notificationIds.length;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check missed medications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [firestore, user, activeProfile]);

  return {
    scheduleReminders,
    scheduleAllReminders,
    rescheduleReminders,
    checkMissed,
    isScheduling,
    error,
  };
}
