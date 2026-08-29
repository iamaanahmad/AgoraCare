'use client';

import { useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import {
  scheduleAppointmentReminders,
  scheduleAllAppointmentReminders,
  rescheduleAppointmentReminders,
  cancelAppointmentReminders,
  acknowledgeAppointmentReminder,
} from '@/lib/appointment-reminder-scheduler';
import { Appointment } from '@/firebase/firestore/appointments';

/**
 * Hook to manage appointment reminders
 */
export function useAppointmentReminders(userId: string | undefined, profileId: string | undefined) {
  const firestore = useFirestore();

  /**
   * Schedule reminders for a specific appointment
   */
  const scheduleReminders = useCallback(
    async (appointment: Appointment) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required data');
      }

      try {
        const notificationIds = await scheduleAppointmentReminders(
          firestore,
          userId,
          profileId,
          appointment
        );
        return notificationIds;
      } catch (error) {
        console.error('Error scheduling appointment reminders:', error);
        throw error;
      }
    },
    [firestore, userId, profileId]
  );

  /**
   * Schedule reminders for all upcoming appointments
   */
  const scheduleAllReminders = useCallback(async () => {
    if (!firestore || !userId || !profileId) {
      throw new Error('Missing required data');
    }

    try {
      const count = await scheduleAllAppointmentReminders(firestore, userId, profileId);
      return count;
    } catch (error) {
      console.error('Error scheduling all appointment reminders:', error);
      throw error;
    }
  }, [firestore, userId, profileId]);

  /**
   * Reschedule reminders for a specific appointment
   */
  const rescheduleReminders = useCallback(
    async (appointment: Appointment) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required data');
      }

      try {
        await rescheduleAppointmentReminders(firestore, userId, profileId, appointment);
      } catch (error) {
        console.error('Error rescheduling appointment reminders:', error);
        throw error;
      }
    },
    [firestore, userId, profileId]
  );

  /**
   * Cancel reminders for a specific appointment
   */
  const cancelReminders = useCallback(
    async (appointmentId: string) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required data');
      }

      try {
        await cancelAppointmentReminders(firestore, userId, profileId, appointmentId);
      } catch (error) {
        console.error('Error cancelling appointment reminders:', error);
        throw error;
      }
    },
    [firestore, userId, profileId]
  );

  /**
   * Acknowledge a reminder
   */
  const acknowledgeReminder = useCallback(
    async (appointmentId: string, reminderType: '24-hour' | '1-hour') => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required data');
      }

      try {
        await acknowledgeAppointmentReminder(
          firestore,
          userId,
          profileId,
          appointmentId,
          reminderType
        );
      } catch (error) {
        console.error('Error acknowledging appointment reminder:', error);
        throw error;
      }
    },
    [firestore, userId, profileId]
  );

  // Auto-schedule reminders for all appointments on mount
  useEffect(() => {
    if (firestore && userId && profileId) {
      scheduleAllReminders().catch((error) => {
        console.error('Error auto-scheduling appointment reminders:', error);
      });
    }
  }, [firestore, userId, profileId, scheduleAllReminders]);

  return {
    scheduleReminders,
    scheduleAllReminders,
    rescheduleReminders,
    cancelReminders,
    acknowledgeReminder,
  };
}
