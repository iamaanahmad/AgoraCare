'use client';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  addDoc,
  limit,
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

// ============================================================================
// Type Definitions
// ============================================================================

export interface NotificationData {
  id: string;
  userId: string;
  profileId: string;
  type: 'medication-reminder' | 'medication-missed' | 'appointment-reminder' | 'emergency' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requireInteraction: boolean;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  voiceAnnouncement: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  emergencyAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate notification data
 */
export function validateNotification(notification: Partial<NotificationData>): string[] {
  const errors: string[] = [];

  if (!notification.userId) {
    errors.push('User ID is required');
  }

  if (!notification.profileId) {
    errors.push('Profile ID is required');
  }

  if (!notification.type) {
    errors.push('Notification type is required');
  }

  if (!notification.title || notification.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!notification.body || notification.body.trim().length === 0) {
    errors.push('Body is required');
  }

  if (!notification.scheduledFor) {
    errors.push('Scheduled time is required');
  }

  return errors;
}

// ============================================================================
// Notification CRUD Operations
// ============================================================================

/**
 * Get notification by ID
 */
export async function getNotification(
  firestore: Firestore,
  notificationId: string
): Promise<NotificationData | null> {
  const notificationRef = doc(firestore, 'notifications', notificationId);
  const notificationDoc = await getDoc(notificationRef);

  if (!notificationDoc.exists()) {
    return null;
  }

  const data = notificationDoc.data();
  return {
    ...data,
    scheduledFor: data.scheduledFor?.toDate() || new Date(),
    sentAt: data.sentAt?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as NotificationData;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  firestore: Firestore,
  userId: string,
  options?: {
    profileId?: string;
    status?: NotificationData['status'];
    type?: NotificationData['type'];
    limit?: number;
    unreadOnly?: boolean;
  }
): Promise<NotificationData[]> {
  const notificationsRef = collection(firestore, 'notifications');
  
  let q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('scheduledFor', 'desc')
  );

  if (options?.profileId) {
    q = query(q, where('profileId', '==', options.profileId));
  }

  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }

  if (options?.type) {
    q = query(q, where('type', '==', options.type));
  }

  if (options?.unreadOnly) {
    q = query(q, where('read', '==', false));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      scheduledFor: data.scheduledFor?.toDate() || new Date(),
      sentAt: data.sentAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as NotificationData;
  });
}

/**
 * Get pending notifications (scheduled but not sent)
 */
export async function getPendingNotifications(
  firestore: Firestore,
  beforeDate?: Date
): Promise<NotificationData[]> {
  const notificationsRef = collection(firestore, 'notifications');
  
  const cutoffDate = beforeDate || new Date();
  
  const q = query(
    notificationsRef,
    where('status', '==', 'scheduled'),
    where('scheduledFor', '<=', Timestamp.fromDate(cutoffDate)),
    orderBy('scheduledFor', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      scheduledFor: data.scheduledFor?.toDate() || new Date(),
      sentAt: data.sentAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as NotificationData;
  });
}

/**
 * Create a new notification
 */
export async function createNotification(
  firestore: Firestore,
  notificationData: Omit<NotificationData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Validate notification data
  const errors = validateNotification(notificationData);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const notificationsRef = collection(firestore, 'notifications');

  const docRef = await addDoc(notificationsRef, {
    ...notificationData,
    scheduledFor: Timestamp.fromDate(notificationData.scheduledFor),
    sentAt: notificationData.sentAt ? Timestamp.fromDate(notificationData.sentAt) : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update the document with its own ID
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id;
}

/**
 * Update notification
 */
export async function updateNotification(
  firestore: Firestore,
  notificationId: string,
  updates: Partial<Omit<NotificationData, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const notificationRef = doc(firestore, 'notifications', notificationId);

  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  if (updates.scheduledFor) {
    updateData.scheduledFor = Timestamp.fromDate(updates.scheduledFor);
  }

  if (updates.sentAt) {
    updateData.sentAt = Timestamp.fromDate(updates.sentAt);
  }

  await updateDoc(notificationRef, updateData);
}

/**
 * Mark notification as sent
 */
export async function markNotificationAsSent(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  await updateNotification(firestore, notificationId, {
    status: 'sent',
    sentAt: new Date(),
  });
}

/**
 * Mark notification as failed
 */
export async function markNotificationAsFailed(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  await updateNotification(firestore, notificationId, {
    status: 'failed',
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  await updateNotification(firestore, notificationId, {
    read: true,
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  firestore: Firestore,
  userId: string,
  profileId?: string
): Promise<void> {
  const notifications = await getUserNotifications(firestore, userId, {
    profileId,
    unreadOnly: true,
  });

  const updatePromises = notifications.map((notification) =>
    markNotificationAsRead(firestore, notification.id)
  );

  await Promise.all(updatePromises);
}

/**
 * Cancel notification
 */
export async function cancelNotification(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  await updateNotification(firestore, notificationId, {
    status: 'cancelled',
  });
}

/**
 * Delete notification
 */
export async function deleteNotification(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  const notificationRef = doc(firestore, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}

/**
 * Delete old notifications (cleanup)
 */
export async function deleteOldNotifications(
  firestore: Firestore,
  olderThanDays: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const notificationsRef = collection(firestore, 'notifications');
  const q = query(
    notificationsRef,
    where('createdAt', '<', Timestamp.fromDate(cutoffDate))
  );

  const snapshot = await getDocs(q);
  
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  return snapshot.size;
}

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Get notification preferences for a profile
 */
export async function getNotificationPreferences(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<NotificationPreferences> {
  const prefsRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'settings',
    'notifications'
  );
  const prefsDoc = await getDoc(prefsRef);

  if (!prefsDoc.exists()) {
    return getDefaultNotificationPreferences();
  }

  return prefsDoc.data() as NotificationPreferences;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  firestore: Firestore,
  userId: string,
  profileId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  const prefsRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'settings',
    'notifications'
  );

  await setDoc(prefsRef, preferences, { merge: true });
}

/**
 * Get default notification preferences
 */
export function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    enabled: true,
    sound: true,
    vibration: true,
    voiceAnnouncement: true,
    medicationReminders: true,
    appointmentReminders: true,
    emergencyAlerts: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  };
}

/**
 * Check if notification should be sent based on preferences and quiet hours
 */
export function shouldSendNotification(
  preferences: NotificationPreferences,
  notificationType: NotificationData['type'],
  scheduledTime: Date = new Date()
): boolean {
  // Check if notifications are enabled
  if (!preferences.enabled) {
    return false;
  }

  // Check type-specific preferences
  if (notificationType === 'medication-reminder' && !preferences.medicationReminders) {
    return false;
  }

  if (notificationType === 'appointment-reminder' && !preferences.appointmentReminders) {
    return false;
  }

  // Emergency alerts always go through
  if (notificationType === 'emergency' || notificationType === 'medication-missed') {
    return true;
  }

  // Check quiet hours
  if (preferences.quietHoursEnabled && preferences.quietHoursStart && preferences.quietHoursEnd) {
    const currentTime = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    const quietStart = startHour * 60 + startMin;
    const quietEnd = endHour * 60 + endMin;

    // Handle quiet hours that span midnight
    if (quietStart > quietEnd) {
      if (currentTime >= quietStart || currentTime < quietEnd) {
        return false;
      }
    } else {
      if (currentTime >= quietStart && currentTime < quietEnd) {
        return false;
      }
    }
  }

  return true;
}
