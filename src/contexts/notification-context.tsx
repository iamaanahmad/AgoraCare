'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useFirestore, useMessaging } from '@/firebase';
import { useAuthContext } from '@/contexts/auth-context';
import { useFamily } from '@/contexts/family-context';
import {
  NotificationData,
  NotificationPreferences,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  getDefaultNotificationPreferences,
} from '@/firebase/firestore/notifications';
import {
  requestNotificationPermission,
  onForegroundMessage,
  saveFCMToken,
  isNotificationSupported,
} from '@/firebase/messaging';
import { NotificationScheduler } from '@/lib/notification-scheduler';

interface NotificationContextValue {
  notifications: NotificationData[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  permissionStatus: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  refresh: () => Promise<void>;
  playNotificationSound: () => void;
  announceNotification: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const messaging = useMessaging();
  const { user } = useAuthContext();
  const { selectedMember: activeProfile } = useFamily();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    getDefaultNotificationPreferences()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [scheduler, setScheduler] = useState<NotificationScheduler | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!firestore || !user || !activeProfile) return;

    try {
      setIsLoading(true);
      const notifs = await getUserNotifications(firestore, user.uid, {
        profileId: activeProfile.id,
        limit: 50,
      });
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user, activeProfile]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!firestore || !user || !activeProfile) return;

    try {
      const prefs = await getNotificationPreferences(firestore, user.uid, activeProfile.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [firestore, user, activeProfile]);

  // Initialize
  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications, loadPreferences]);

  // Check permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        if (messaging && user && firestore) {
          try {
            const token = await requestNotificationPermission(messaging);
            if (token) {
              await saveFCMToken(user.uid, token, firestore);
            }
          } catch (err) {
            console.warn('FCM token registration error:', err);
          }
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }, [messaging, user, firestore]);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onForegroundMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Refresh notifications
      loadNotifications();

      // Play sound if enabled
      if (preferences.sound) {
        playNotificationSound();
      }

      // Show browser notification
      if (payload.notification) {
        new Notification(payload.notification.title || 'AgoraCare', {
          body: payload.notification.body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        });
      }
    });

    return unsubscribe || undefined;
  }, [messaging, preferences.sound, loadNotifications]);

  // Initialize notification scheduler
  useEffect(() => {
    if (!firestore || !user) return;

    const sendNotification = async (notification: NotificationData): Promise<boolean> => {
      try {
        // For web, we'll use browser notifications
        if (isNotificationSupported() && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: notification.id,
            requireInteraction: notification.requireInteraction,
            data: notification.data,
          });

          // Play sound if enabled
          if (preferences.sound) {
            playNotificationSound();
          }

          // Voice announcement if enabled
          if (preferences.voiceAnnouncement) {
            announceNotification(notification);
          }

          return true;
        }
        return false;
      } catch (error) {
        console.error('Error sending notification:', error);
        return false;
      }
    };

    const newScheduler = new NotificationScheduler(firestore, sendNotification);
    newScheduler.start();
    setScheduler(newScheduler);

    return () => {
      newScheduler.stop();
    };
  }, [firestore, user, preferences.sound, preferences.voiceAnnouncement]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!firestore) return;

      try {
        await markNotificationAsRead(firestore, notificationId);
        await loadNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    [firestore, loadNotifications]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!firestore || !user || !activeProfile) return;

    try {
      await markAllNotificationsAsRead(firestore, user.uid, activeProfile.id);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [firestore, user, activeProfile, loadNotifications]);

  // Update preferences
  const updatePrefs = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!firestore || !user || !activeProfile) return;

      try {
        await updateNotificationPreferences(firestore, user.uid, activeProfile.id, prefs);
        await loadPreferences();
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    },
    [firestore, user, activeProfile, loadPreferences]
  );

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!preferences.sound) return;

    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.error('Error playing notification sound:', error);
      });
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  }, [preferences.sound]);

  // Announce notification with voice
  const announceNotification = useCallback(
    (notification: NotificationData) => {
      if (!preferences.voiceAnnouncement) return;

      try {
        const utterance = new SpeechSynthesisUtterance(
          `${notification.title}. ${notification.body}`
        );
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error announcing notification:', error);
      }
    },
    [preferences.voiceAnnouncement]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    permissionStatus,
    requestPermission,
    markAsRead,
    markAllAsRead,
    updatePreferences: updatePrefs,
    refresh: loadNotifications,
    playNotificationSound,
    announceNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
