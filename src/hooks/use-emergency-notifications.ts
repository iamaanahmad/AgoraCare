'use client';

import { useState, useCallback } from 'react';
import { EmergencyContact } from '@/firebase/firestore/users';
import {
  getEmergencyNotificationService,
  NotificationResult,
  EmergencyNotificationParams,
} from '@/lib/emergency/emergency-notification-service';
import { useFirestore } from '@/firebase';
import { createEmergencyEvent, updateEmergencyEvent } from '@/firebase/firestore/emergency-events';

export function useEmergencyNotifications(userId: string | undefined) {
  const firestore = useFirestore();
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationResults, setNotificationResults] = useState<NotificationResult[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const notificationService = getEmergencyNotificationService();

  /**
   * Notify all emergency contacts
   */
  const notifyContacts = useCallback(
    async (contacts: EmergencyContact[], params: EmergencyNotificationParams) => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      setIsNotifying(true);
      setError(null);

      try {
        // Create emergency event in Firestore
        const eventId = await createEmergencyEvent(firestore, userId, {
          userId,
          profileId: params.profileId,
          triggeredBy: 'button',
          type: params.emergencyType,
          status: 'in-progress',
          contactsNotified: [],
          triggerKeyword: params.triggerKeyword,
          location: params.location,
        });

        // Send notifications to all contacts
        const results = await notificationService.notifyAllContacts(contacts, params);
        setNotificationResults(results);

        // Update event with notified contacts
        const notifiedContactIds = results
          .filter(r => r.sms?.success || r.push?.success)
          .map(r => r.contactId);

        await updateEmergencyEvent(firestore, userId, eventId, {
          contactsNotified: notifiedContactIds,
          status: notifiedContactIds.length > 0 ? 'completed' : 'failed',
          notes: `Notified ${notifiedContactIds.length} of ${contacts.length} contacts`,
        });

        return { eventId, results };
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsNotifying(false);
      }
    },
    [userId, firestore, notificationService]
  );

  /**
   * Send follow-up notification
   */
  const sendFollowUp = useCallback(
    async (
      contacts: EmergencyContact[],
      params: EmergencyNotificationParams & {
        status: 'resolved' | 'ongoing' | 'escalated';
        updateMessage: string;
      }
    ) => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      setIsNotifying(true);
      setError(null);

      try {
        const results = await notificationService.sendFollowUp(contacts, params);
        setNotificationResults(results);
        return results;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsNotifying(false);
      }
    },
    [userId, notificationService]
  );

  /**
   * Test notification to a single contact
   */
  const testNotification = useCallback(
    async (contact: EmergencyContact) => {
      setIsNotifying(true);
      setError(null);

      try {
        const result = await notificationService.testNotification(contact);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsNotifying(false);
      }
    },
    [notificationService]
  );

  /**
   * Get notification success rate
   */
  const getSuccessRate = useCallback(() => {
    if (notificationResults.length === 0) return 0;

    const successful = notificationResults.filter(
      r => r.sms?.success || r.push?.success
    ).length;

    return (successful / notificationResults.length) * 100;
  }, [notificationResults]);

  /**
   * Get failed notifications
   */
  const getFailedNotifications = useCallback(() => {
    return notificationResults.filter(
      r => !r.sms?.success && !r.push?.success
    );
  }, [notificationResults]);

  return {
    isNotifying,
    notificationResults,
    error,
    notifyContacts,
    sendFollowUp,
    testNotification,
    getSuccessRate,
    getFailedNotifications,
  };
}
