'use client';

import { Firestore } from 'firebase/firestore';
import {
  Appointment,
  getUpcomingAppointments,
  updateReminderSent,
} from '@/firebase/firestore/appointments';
import {
  NotificationData,
  createNotification,
  getUserNotifications,
  getNotificationPreferences,
  shouldSendNotification,
} from '@/firebase/firestore/notifications';

// ============================================================================
// Appointment Reminder Scheduling
// ============================================================================

/**
 * Schedule reminders for a specific appointment
 * Creates two reminders: 24 hours before and 1 hour before
 */
export async function scheduleAppointmentReminders(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointment: Appointment
): Promise<string[]> {
  const notificationIds: string[] = [];

  // Get user preferences
  const preferences = await getNotificationPreferences(firestore, userId, profileId);

  // Calculate reminder times
  const appointmentTime = appointment.dateTime;
  const twentyFourHoursBefore = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
  const oneHourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000);

  const now = new Date();

  // Schedule 24-hour reminder if not already sent and time hasn't passed
  if (!appointment.remindersSent[0] && twentyFourHoursBefore > now) {
    if (shouldSendNotification(preferences, 'appointment-reminder', twentyFourHoursBefore)) {
      try {
        const notificationId = await createNotification(firestore, {
          userId,
          profileId,
          type: 'appointment-reminder',
          title: 'Appointment Tomorrow',
          body: `Reminder: You have an appointment with ${appointment.doctorName} tomorrow at ${appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          data: {
            appointmentId: appointment.id,
            doctorName: appointment.doctorName,
            specialization: appointment.specialization,
            appointmentTime: appointmentTime.toISOString(),
            location: appointment.location,
            reminderType: '24-hour',
          },
          scheduledFor: twentyFourHoursBefore,
          status: 'scheduled',
          priority: 'normal',
          requireInteraction: false,
          read: false,
          actionUrl: `/appointments?id=${appointment.id}`,
        });

        notificationIds.push(notificationId);
      } catch (error) {
        console.error('Error creating 24-hour appointment reminder:', error);
      }
    }
  }

  // Schedule 1-hour reminder if not already sent and time hasn't passed
  if (!appointment.remindersSent[1] && oneHourBefore > now) {
    if (shouldSendNotification(preferences, 'appointment-reminder', oneHourBefore)) {
      try {
        const notificationId = await createNotification(firestore, {
          userId,
          profileId,
          type: 'appointment-reminder',
          title: 'Appointment in 1 Hour',
          body: `Your appointment with ${appointment.doctorName} is in 1 hour at ${appointment.location}`,
          data: {
            appointmentId: appointment.id,
            doctorName: appointment.doctorName,
            specialization: appointment.specialization,
            appointmentTime: appointmentTime.toISOString(),
            location: appointment.location,
            reminderType: '1-hour',
          },
          scheduledFor: oneHourBefore,
          status: 'scheduled',
          priority: 'high',
          requireInteraction: true,
          read: false,
          actionUrl: `/appointments?id=${appointment.id}`,
        });

        notificationIds.push(notificationId);
      } catch (error) {
        console.error('Error creating 1-hour appointment reminder:', error);
      }
    }
  }

  return notificationIds;
}

/**
 * Schedule reminders for all upcoming appointments for a profile
 */
export async function scheduleAllAppointmentReminders(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<number> {
  const appointments = await getUpcomingAppointments(firestore, userId, profileId);

  let totalScheduled = 0;

  for (const appointment of appointments) {
    const notificationIds = await scheduleAppointmentReminders(
      firestore,
      userId,
      profileId,
      appointment
    );
    totalScheduled += notificationIds.length;
  }

  return totalScheduled;
}

/**
 * Reschedule reminders for a specific appointment (cancel old, create new)
 */
export async function rescheduleAppointmentReminders(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointment: Appointment
): Promise<void> {
  // Cancel existing scheduled reminders for this appointment
  const { cancelNotification } = await import('@/firebase/firestore/notifications');

  const existingNotifications = await getUserNotifications(firestore, userId, {
    profileId,
    status: 'scheduled',
    type: 'appointment-reminder',
  });

  const appointmentNotifications = existingNotifications.filter(
    (n) => n.data?.appointmentId === appointment.id
  );

  for (const notification of appointmentNotifications) {
    await cancelNotification(firestore, notification.id);
  }

  // Schedule new reminders
  await scheduleAppointmentReminders(firestore, userId, profileId, appointment);
}

/**
 * Cancel reminders for a specific appointment
 */
export async function cancelAppointmentReminders(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string
): Promise<void> {
  const { cancelNotification } = await import('@/firebase/firestore/notifications');

  const existingNotifications = await getUserNotifications(firestore, userId, {
    profileId,
    status: 'scheduled',
    type: 'appointment-reminder',
  });

  const appointmentNotifications = existingNotifications.filter(
    (n) => n.data?.appointmentId === appointmentId
  );

  for (const notification of appointmentNotifications) {
    await cancelNotification(firestore, notification.id);
  }
}

// ============================================================================
// Reminder Acknowledgment
// ============================================================================

/**
 * Mark a reminder as acknowledged and update the appointment
 */
export async function acknowledgeAppointmentReminder(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string,
  reminderType: '24-hour' | '1-hour'
): Promise<void> {
  const reminderIndex = reminderType === '24-hour' ? 0 : 1;

  try {
    await updateReminderSent(firestore, userId, profileId, appointmentId, reminderIndex);
  } catch (error) {
    console.error('Error acknowledging appointment reminder:', error);
    throw error;
  }
}

/**
 * Check if reminders need to be sent and update reminder status
 */
export async function checkAndUpdateAppointmentReminders(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<{ updated: number }> {
  const appointments = await getUpcomingAppointments(firestore, userId, profileId);
  const now = new Date();
  let updated = 0;

  for (const appointment of appointments) {
    const appointmentTime = appointment.dateTime;
    const twentyFourHoursBefore = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    const oneHourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000);

    // Check if 24-hour reminder should be marked as sent
    if (!appointment.remindersSent[0] && now >= twentyFourHoursBefore) {
      // Check if notification was actually sent
      const notifications = await getUserNotifications(firestore, userId, {
        profileId,
        type: 'appointment-reminder',
      });

      const twentyFourHourNotification = notifications.find(
        (n) =>
          n.data?.appointmentId === appointment.id &&
          n.data?.reminderType === '24-hour' &&
          n.status === 'sent'
      );

      if (twentyFourHourNotification) {
        await updateReminderSent(firestore, userId, profileId, appointment.id, 0);
        updated++;
      }
    }

    // Check if 1-hour reminder should be marked as sent
    if (!appointment.remindersSent[1] && now >= oneHourBefore) {
      // Check if notification was actually sent
      const notifications = await getUserNotifications(firestore, userId, {
        profileId,
        type: 'appointment-reminder',
      });

      const oneHourNotification = notifications.find(
        (n) =>
          n.data?.appointmentId === appointment.id &&
          n.data?.reminderType === '1-hour' &&
          n.status === 'sent'
      );

      if (oneHourNotification) {
        await updateReminderSent(firestore, userId, profileId, appointment.id, 1);
        updated++;
      }
    }
  }

  return { updated };
}

// ============================================================================
// Appointment Reminder Scheduler Service
// ============================================================================

export class AppointmentReminderScheduler {
  private firestore: Firestore;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  /**
   * Start the appointment reminder scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Appointment reminder scheduler is already running');
      return;
    }

    console.log('Starting appointment reminder scheduler...');

    // Process immediately
    this.processReminders();

    // Then process every 5 minutes
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, this.checkInterval);
  }

  /**
   * Stop the appointment reminder scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Appointment reminder scheduler stopped');
    }
  }

  /**
   * Process appointment reminders for all users
   * Note: In production, this should be handled by a backend service
   */
  private async processReminders(): Promise<void> {
    try {
      // This is a placeholder - in production, you would:
      // 1. Use Cloud Functions to trigger this periodically
      // 2. Query all users with upcoming appointments
      // 3. Schedule reminders for each user
      console.log('Processing appointment reminders...');
    } catch (error) {
      console.error('Error in appointment reminder scheduler:', error);
    }
  }

  /**
   * Schedule reminders for a specific user and profile
   */
  async scheduleRemindersForProfile(userId: string, profileId: string): Promise<void> {
    try {
      const count = await scheduleAllAppointmentReminders(this.firestore, userId, profileId);
      if (count > 0) {
        console.log(`Scheduled ${count} appointment reminders for profile ${profileId}`);
      }
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
    }
  }

  /**
   * Check and update reminder status for a specific user and profile
   */
  async checkRemindersForProfile(userId: string, profileId: string): Promise<void> {
    try {
      const result = await checkAndUpdateAppointmentReminders(this.firestore, userId, profileId);
      if (result.updated > 0) {
        console.log(`Updated ${result.updated} appointment reminder statuses`);
      }
    } catch (error) {
      console.error('Error checking appointment reminders:', error);
    }
  }
}
