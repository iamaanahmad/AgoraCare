'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import {
  Appointment,
  getAppointments,
  getUpcomingAppointments,
  getAppointmentsByDateRange,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
  completeAppointment,
} from '@/firebase/firestore/appointments';

export function useAppointments(userId: string | undefined, profileId: string | undefined) {
  const firestore = useFirestore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!firestore || !userId || !profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAppointments(firestore, userId, profileId);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [firestore, userId, profileId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!firestore || !userId || !profileId) {
      throw new Error('Missing required data');
    }

    try {
      const id = await createAppointment(firestore, userId, profileId, appointmentData);
      await fetchAppointments();
      
      // Schedule reminders for the new appointment
      try {
        const { scheduleAppointmentReminders } = await import('@/lib/appointment-reminder-scheduler');
        const appointment = await import('@/firebase/firestore/appointments').then(m => 
          m.getAppointment(firestore, userId, profileId, id)
        );
        if (appointment) {
          await scheduleAppointmentReminders(firestore, userId, profileId, appointment);
          
          // Sync to external calendars
          try {
            const { syncAppointmentToCalendars } = await import('@/lib/calendar/calendar-sync-service');
            await syncAppointmentToCalendars(firestore, userId, appointment);
          } catch (syncError) {
            console.error('Error syncing to calendars:', syncError);
            // Don't throw - appointment was created successfully
          }
        }
      } catch (reminderError) {
        console.error('Error scheduling appointment reminders:', reminderError);
        // Don't throw - appointment was created successfully
      }
      
      return id;
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  };

  const editAppointment = async (
    appointmentId: string,
    updates: Partial<Omit<Appointment, 'id' | 'profileId' | 'createdAt'>>
  ) => {
    if (!firestore || !userId || !profileId) {
      throw new Error('Missing required data');
    }

    try {
      await updateAppointment(firestore, userId, profileId, appointmentId, updates);
      await fetchAppointments();
      
      // Reschedule reminders if date/time changed
      if (updates.dateTime) {
        try {
          const { rescheduleAppointmentReminders } = await import('@/lib/appointment-reminder-scheduler');
          const appointment = await import('@/firebase/firestore/appointments').then(m => 
            m.getAppointment(firestore, userId, profileId, appointmentId)
          );
          if (appointment) {
            await rescheduleAppointmentReminders(firestore, userId, profileId, appointment);
            
            // Sync updates to external calendars
            try {
              const { syncAppointmentToCalendars } = await import('@/lib/calendar/calendar-sync-service');
              await syncAppointmentToCalendars(firestore, userId, appointment);
            } catch (syncError) {
              console.error('Error syncing to calendars:', syncError);
              // Don't throw - appointment was updated successfully
            }
          }
        } catch (reminderError) {
          console.error('Error rescheduling appointment reminders:', reminderError);
          // Don't throw - appointment was updated successfully
        }
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      throw err;
    }
  };

  const removeAppointment = async (appointmentId: string) => {
    if (!firestore || !userId || !profileId) {
      throw new Error('Missing required data');
    }

    try {
      await deleteAppointment(firestore, userId, profileId, appointmentId);
      await fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err);
      throw err;
    }
  };

  const cancelAppt = async (appointmentId: string) => {
    if (!firestore || !userId || !profileId) {
      throw new Error('Missing required data');
    }

    try {
      await cancelAppointment(firestore, userId, profileId, appointmentId);
      await fetchAppointments();
      
      // Cancel reminders for the cancelled appointment
      try {
        const { cancelAppointmentReminders } = await import('@/lib/appointment-reminder-scheduler');
        await cancelAppointmentReminders(firestore, userId, profileId, appointmentId);
      } catch (reminderError) {
        console.error('Error cancelling appointment reminders:', reminderError);
        // Don't throw - appointment was cancelled successfully
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      throw err;
    }
  };

  const completeAppt = async (appointmentId: string) => {
    if (!firestore || !userId || !profileId) {
      throw new Error('Missing required data');
    }

    try {
      await completeAppointment(firestore, userId, profileId, appointmentId);
      await fetchAppointments();
    } catch (err) {
      console.error('Error completing appointment:', err);
      throw err;
    }
  };

  return {
    appointments,
    loading,
    error,
    addAppointment,
    editAppointment,
    removeAppointment,
    cancelAppointment: cancelAppt,
    completeAppointment: completeAppt,
    refresh: fetchAppointments,
  };
}

export function useUpcomingAppointments(userId: string | undefined, profileId: string | undefined) {
  const firestore = useFirestore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async () => {
    if (!firestore || !userId || !profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUpcomingAppointments(firestore, userId, profileId);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching upcoming appointments:', err);
      setError('Failed to load upcoming appointments');
    } finally {
      setLoading(false);
    }
  }, [firestore, userId, profileId]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  return {
    appointments,
    loading,
    error,
    refresh: fetchUpcoming,
  };
}
