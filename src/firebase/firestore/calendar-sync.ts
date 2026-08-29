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
  Timestamp,
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { CalendarSync, CalendarProvider } from '@/lib/calendar/types';

/**
 * Get calendar sync configuration for a user and provider
 */
export async function getCalendarSync(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider
): Promise<CalendarSync | null> {
  const syncRef = doc(firestore, 'calendarSyncs', `${userId}_${provider}`);
  const syncDoc = await getDoc(syncRef);

  if (!syncDoc.exists()) {
    return null;
  }

  const data = syncDoc.data();
  return {
    ...data,
    expiresAt: data.expiresAt?.toDate() || new Date(),
    lastSyncAt: data.lastSyncAt?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as CalendarSync;
}

/**
 * Get all calendar syncs for a user
 */
export async function getAllCalendarSyncs(
  firestore: Firestore,
  userId: string
): Promise<CalendarSync[]> {
  const syncsRef = collection(firestore, 'calendarSyncs');
  const q = query(syncsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      expiresAt: data.expiresAt?.toDate() || new Date(),
      lastSyncAt: data.lastSyncAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CalendarSync;
  });
}

/**
 * Create or update calendar sync configuration
 */
export async function saveCalendarSync(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider,
  syncData: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    email?: string;
  }
): Promise<void> {
  const syncRef = doc(firestore, 'calendarSyncs', `${userId}_${provider}`);
  const existingSync = await getDoc(syncRef);

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + syncData.expiresIn);

  const syncConfig: Partial<CalendarSync> = {
    userId,
    provider,
    accessToken: syncData.accessToken,
    refreshToken: syncData.refreshToken,
    expiresAt,
    lastSyncAt: new Date(),
    syncEnabled: true,
    email: syncData.email,
    updatedAt: new Date(),
  };

  if (existingSync.exists()) {
    await updateDoc(syncRef, {
      ...syncConfig,
      expiresAt: Timestamp.fromDate(expiresAt),
      lastSyncAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } else {
    await setDoc(syncRef, {
      ...syncConfig,
      id: syncRef.id,
      expiresAt: Timestamp.fromDate(expiresAt),
      lastSyncAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Update calendar sync tokens
 */
export async function updateCalendarTokens(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const syncRef = doc(firestore, 'calendarSyncs', `${userId}_${provider}`);
  
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  await updateDoc(syncRef, {
    accessToken,
    refreshToken,
    expiresAt: Timestamp.fromDate(expiresAt),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update last sync timestamp
 */
export async function updateLastSync(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider
): Promise<void> {
  const syncRef = doc(firestore, 'calendarSyncs', `${userId}_${provider}`);
  await updateDoc(syncRef, {
    lastSyncAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Enable or disable calendar sync
 */
export async function toggleCalendarSync(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider,
  enabled: boolean
): Promise<void> {
  const syncRef = doc(firestore, 'calendarSyncs', `${userId}_${provider}`);
  await updateDoc(syncRef, {
    syncEnabled: enabled,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete calendar sync configuration
 */
export async function deleteCalendarSync(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider
): Promise<void> {
  const syncRef = doc(firestore, 'calendarSyncs', `${userId}_${provider}`);
  await deleteDoc(syncRef);
}

/**
 * Check if token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(sync: CalendarSync): boolean {
  const now = new Date();
  const expiresAt = new Date(sync.expiresAt);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  return expiresAt <= fiveMinutesFromNow;
}
