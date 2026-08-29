'use client';

import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { useMessaging } from '@/firebase';

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(
  messaging: ReturnType<typeof useMessaging>
): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase Messaging not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(
  messaging: ReturnType<typeof useMessaging>,
  callback: (payload: MessagePayload) => void
): (() => void) | null {
  if (!messaging) {
    return null;
  }

  const unsubscribe = onMessage(messaging, callback);
  return unsubscribe;
}

/**
 * Save FCM token to Firestore for the user
 */
export async function saveFCMToken(
  userId: string,
  token: string,
  firestore: any
): Promise<void> {
  const { doc, setDoc } = await import('firebase/firestore');
  
  const tokenRef = doc(firestore, 'users', userId, 'fcmTokens', token);
  await setDoc(tokenRef, {
    token,
    createdAt: new Date(),
    platform: 'web',
    userAgent: navigator.userAgent,
  });
}

/**
 * Remove FCM token from Firestore
 */
export async function removeFCMToken(
  userId: string,
  token: string,
  firestore: any
): Promise<void> {
  const { doc, deleteDoc } = await import('firebase/firestore');
  
  const tokenRef = doc(firestore, 'users', userId, 'fcmTokens', token);
  await deleteDoc(tokenRef);
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Display a local notification (for foreground messages)
 */
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    ...options,
  });
}
