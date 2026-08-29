'use client';

import { Firestore } from 'firebase/firestore';
import {
  Medication,
  AdherenceRecord,
  getActiveMedications,
  getAdherenceRecords,
} from '@/firebase/firestore/medications';
import {
  NotificationData,
  createNotification,
  getPendingNotifications,
  updateNotification,
  getNotificationPreferences,
  shouldSendNotification,
} from '@/firebase/firestore/notifications';
import {
  generateSchedule,
  getTodaysScheduledDoses,
  ScheduledDose,
} from '@/lib/medication-scheduler';

// ============================================================================
// Medication Reminder Scheduling
// ============================================================================

/**
 * Schedule medication reminders for a specific medication
 */
export async function scheduleMedicationReminders(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medication: Medication,
  daysAhead: number = 7
): Promise<string[]> {
  const notificationIds: string[] = [];

  // Generate schedule for the next N days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const schedule = generateSchedule(
    medication.frequency,
    medication.timing,
    medication.startDate,
    endDate
  );

  // Get user preferences
  const preferences = await getNotificationPreferences(firestore, userId, profileId);

  // Create notifications for each scheduled dose
  for (const dose of schedule) {
    // Skip if dose is in the past
    if (dose.date < new Date()) {
      continue;
    }

    // Check if notification should be sent based on preferences
    if (!shouldSendNotification(preferences, 'medication-reminder', dose.date)) {
      continue;
    }

    try {
      const notificationId = await createNotification(firestore, {
        userId,
        profileId,
        type: 'medication-reminder',
        title: `Time for ${medication.name}`,
        body: `Take ${medication.dosage} ${medication.instructions ? `- ${medication.instructions}` : ''}`,
        data: {
          medicationId: medication.id,
          medicationName: medication.name,
          dosage: medication.dosage,
          scheduledTime: dose.date.toISOString(),
          timing: dose.timing,
        },
        scheduledFor: dose.date,
        status: 'scheduled',
        priority: 'high',
        requireInteraction: true,
        read: false,
        actionUrl: `/medications?id=${medication.id}`,
      });

      notificationIds.push(notificationId);
    } catch (error) {
      console.error('Error creating medication reminder:', error);
    }
  }

  return notificationIds;
}

/**
 * Schedule reminders for all active medications for a profile
 */
export async function scheduleAllMedicationReminders(
  firestore: Firestore,
  userId: string,
  profileId: string,
  daysAhead: number = 7
): Promise<number> {
  const medications = await getActiveMedications(firestore, userId, profileId);
  
  let totalScheduled = 0;

  for (const medication of medications) {
    const notificationIds = await scheduleMedicationReminders(
      firestore,
      userId,
      profileId,
      medication,
      daysAhead
    );
    totalScheduled += notificationIds.length;
  }

  return totalScheduled;
}

/**
 * Reschedule reminders for a specific medication (cancel old, create new)
 */
export async function rescheduleMedicationReminders(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medication: Medication
): Promise<void> {
  // Cancel existing scheduled reminders for this medication
  const { getUserNotifications, cancelNotification } = await import('@/firebase/firestore/notifications');
  
  const existingNotifications = await getUserNotifications(firestore, userId, {
    profileId,
    status: 'scheduled',
    type: 'medication-reminder',
  });

  const medicationNotifications = existingNotifications.filter(
    (n) => n.data?.medicationId === medication.id
  );

  for (const notification of medicationNotifications) {
    await cancelNotification(firestore, notification.id);
  }

  // Schedule new reminders
  await scheduleMedicationReminders(firestore, userId, profileId, medication);
}

// ============================================================================
// Missed Medication Detection
// ============================================================================

/**
 * Check for missed medications and create follow-up notifications
 */
export async function checkMissedMedications(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<string[]> {
  const notificationIds: string[] = [];
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // Get active medications
  const medications = await getActiveMedications(firestore, userId, profileId);

  for (const medication of medications) {
    // Get today's scheduled doses
    const todaysDoses = getTodaysScheduledDoses(
      medication.frequency,
      medication.timing,
      medication.startDate,
      now
    );

    // Check each dose
    for (const dose of todaysDoses) {
      // Skip if dose is in the future
      if (dose.date > now) {
        continue;
      }

      // Check if dose was more than 15 minutes ago
      if (dose.date < fifteenMinutesAgo) {
        // Check if there's an adherence record for this dose
        const adherenceRecords = await getAdherenceRecords(
          firestore,
          userId,
          profileId,
          medication.id,
          dose.date,
          new Date(dose.date.getTime() + 60 * 60 * 1000) // 1 hour window
        );

        const hasRecord = adherenceRecords.some(
          (record) =>
            Math.abs(record.scheduledTime.getTime() - dose.date.getTime()) < 60 * 60 * 1000
        );

        if (!hasRecord) {
          // Check if we already sent a missed notification for this dose
          const { getUserNotifications } = await import('@/firebase/firestore/notifications');
          const existingMissedNotifications = await getUserNotifications(firestore, userId, {
            profileId,
            type: 'medication-missed',
          });

          const alreadyNotified = existingMissedNotifications.some(
            (n) =>
              n.data?.medicationId === medication.id &&
              n.data?.scheduledTime === dose.date.toISOString()
          );

          if (!alreadyNotified) {
            // Create missed medication notification
            const followUpTime = new Date(dose.date.getTime() + 15 * 60 * 1000);

            try {
              const notificationId = await createNotification(firestore, {
                userId,
                profileId,
                type: 'medication-missed',
                title: `Missed: ${medication.name}`,
                body: `You missed your ${medication.dosage} dose. Please take it now if possible.`,
                data: {
                  medicationId: medication.id,
                  medicationName: medication.name,
                  dosage: medication.dosage,
                  scheduledTime: dose.date.toISOString(),
                  missedTime: now.toISOString(),
                },
                scheduledFor: followUpTime,
                status: 'scheduled',
                priority: 'urgent',
                requireInteraction: true,
                read: false,
                actionUrl: `/medications?id=${medication.id}`,
              });

              notificationIds.push(notificationId);
            } catch (error) {
              console.error('Error creating missed medication notification:', error);
            }
          }
        }
      }
    }
  }

  return notificationIds;
}

// ============================================================================
// Notification Delivery
// ============================================================================

/**
 * Process and send pending notifications
 */
export async function processPendingNotifications(
  firestore: Firestore,
  sendNotificationFn: (notification: NotificationData) => Promise<boolean>
): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const thirtySecondsFromNow = new Date(now.getTime() + 30 * 1000);

  // Get notifications that should be sent within the next 30 seconds
  const pendingNotifications = await getPendingNotifications(firestore, thirtySecondsFromNow);

  let sent = 0;
  let failed = 0;

  for (const notification of pendingNotifications) {
    try {
      // Check if it's time to send (within 30 seconds)
      const timeDiff = notification.scheduledFor.getTime() - now.getTime();
      if (timeDiff > 30 * 1000) {
        continue; // Not yet time
      }

      // Get user preferences
      const preferences = await getNotificationPreferences(
        firestore,
        notification.userId,
        notification.profileId
      );

      // Check if notification should be sent
      if (!shouldSendNotification(preferences, notification.type, notification.scheduledFor)) {
        // Cancel notification
        await updateNotification(firestore, notification.id, {
          status: 'cancelled',
        });
        continue;
      }

      // Send notification
      const success = await sendNotificationFn(notification);

      if (success) {
        // Mark as sent
        await updateNotification(firestore, notification.id, {
          status: 'sent',
          sentAt: new Date(),
        });
        sent++;
      } else {
        // Mark as failed
        await updateNotification(firestore, notification.id, {
          status: 'failed',
        });
        failed++;
      }
    } catch (error) {
      console.error('Error processing notification:', error);
      failed++;
    }
  }

  return { sent, failed };
}

// ============================================================================
// Notification Scheduler Service
// ============================================================================

export class NotificationScheduler {
  private firestore: Firestore;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 30 * 1000; // 30 seconds
  private sendNotificationFn: (notification: NotificationData) => Promise<boolean>;

  constructor(
    firestore: Firestore,
    sendNotificationFn: (notification: NotificationData) => Promise<boolean>
  ) {
    this.firestore = firestore;
    this.sendNotificationFn = sendNotificationFn;
  }

  /**
   * Start the notification scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Notification scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler...');

    // Process immediately
    this.processNotifications();

    // Then process every 30 seconds
    this.intervalId = setInterval(() => {
      this.processNotifications();
    }, this.checkInterval);
  }

  /**
   * Stop the notification scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Notification scheduler stopped');
    }
  }

  /**
   * Process pending notifications
   */
  private async processNotifications(): Promise<void> {
    try {
      const result = await processPendingNotifications(this.firestore, this.sendNotificationFn);
      
      if (result.sent > 0 || result.failed > 0) {
        console.log(`Notifications processed: ${result.sent} sent, ${result.failed} failed`);
      }
    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  }

  /**
   * Check for missed medications
   */
  async checkMissedMedications(userId: string, profileId: string): Promise<void> {
    try {
      const notificationIds = await checkMissedMedications(
        this.firestore,
        userId,
        profileId
      );

      if (notificationIds.length > 0) {
        console.log(`Created ${notificationIds.length} missed medication notifications`);
      }
    } catch (error) {
      console.error('Error checking missed medications:', error);
    }
  }
}
