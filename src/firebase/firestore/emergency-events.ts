'use client';

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export interface EmergencyEvent {
  id: string;
  profileId: string;
  userId: string;
  triggeredBy: 'voice' | 'button' | 'auto';
  timestamp: Date;
  type: 'call-doctor' | 'notify-family' | 'emergency-services';
  status: 'initiated' | 'in-progress' | 'completed' | 'failed';
  contactsNotified: string[];
  callDuration?: number;
  notes?: string;
  triggerKeyword?: string;
  location?: string;
  resolvedAt?: Date;
}

/**
 * Create a new emergency event
 */
export async function createEmergencyEvent(
  firestore: Firestore,
  userId: string,
  eventData: Omit<EmergencyEvent, 'id' | 'timestamp'>
): Promise<string> {
  const eventsRef = collection(firestore, 'users', userId, 'emergencyEvents');
  
  const docRef = await addDoc(eventsRef, {
    ...eventData,
    timestamp: Timestamp.now(),
    resolvedAt: eventData.resolvedAt ? Timestamp.fromDate(eventData.resolvedAt) : null,
  });
  
  return docRef.id;
}

/**
 * Get emergency event by ID
 */
export async function getEmergencyEvent(
  firestore: Firestore,
  userId: string,
  eventId: string
): Promise<EmergencyEvent | null> {
  const eventRef = doc(firestore, 'users', userId, 'emergencyEvents', eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    return null;
  }
  
  const data = eventDoc.data();
  return {
    ...data,
    id: eventDoc.id,
    timestamp: data.timestamp?.toDate() || new Date(),
    resolvedAt: data.resolvedAt?.toDate(),
  } as EmergencyEvent;
}

/**
 * Update emergency event
 */
export async function updateEmergencyEvent(
  firestore: Firestore,
  userId: string,
  eventId: string,
  updates: Partial<Omit<EmergencyEvent, 'id' | 'timestamp'>>
): Promise<void> {
  const eventRef = doc(firestore, 'users', userId, 'emergencyEvents', eventId);
  
  const updateData: any = { ...updates };
  
  if (updates.resolvedAt) {
    updateData.resolvedAt = Timestamp.fromDate(updates.resolvedAt);
  }
  
  await updateDoc(eventRef, updateData);
}

/**
 * Get recent emergency events for a user
 */
export async function getRecentEmergencyEvents(
  firestore: Firestore,
  userId: string,
  limitCount: number = 10
): Promise<EmergencyEvent[]> {
  const eventsRef = collection(firestore, 'users', userId, 'emergencyEvents');
  const q = query(
    eventsRef,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate() || new Date(),
      resolvedAt: data.resolvedAt?.toDate(),
    } as EmergencyEvent;
  });
}

/**
 * Get emergency events for a specific profile
 */
export async function getProfileEmergencyEvents(
  firestore: Firestore,
  userId: string,
  profileId: string,
  limitCount: number = 10
): Promise<EmergencyEvent[]> {
  const eventsRef = collection(firestore, 'users', userId, 'emergencyEvents');
  const q = query(
    eventsRef,
    where('profileId', '==', profileId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate() || new Date(),
      resolvedAt: data.resolvedAt?.toDate(),
    } as EmergencyEvent;
  });
}

/**
 * Get active (unresolved) emergency events
 */
export async function getActiveEmergencyEvents(
  firestore: Firestore,
  userId: string
): Promise<EmergencyEvent[]> {
  const eventsRef = collection(firestore, 'users', userId, 'emergencyEvents');
  const q = query(
    eventsRef,
    where('status', 'in', ['initiated', 'in-progress']),
    orderBy('timestamp', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate() || new Date(),
      resolvedAt: data.resolvedAt?.toDate(),
    } as EmergencyEvent;
  });
}

/**
 * Mark emergency event as resolved
 */
export async function resolveEmergencyEvent(
  firestore: Firestore,
  userId: string,
  eventId: string,
  notes?: string
): Promise<void> {
  await updateEmergencyEvent(firestore, userId, eventId, {
    status: 'completed',
    resolvedAt: new Date(),
    notes,
  });
}

/**
 * Get emergency event statistics
 */
export async function getEmergencyEventStats(
  firestore: Firestore,
  userId: string,
  profileId?: string
): Promise<{
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageResponseTime: number;
}> {
  const eventsRef = collection(firestore, 'users', userId, 'emergencyEvents');
  let q = query(eventsRef);
  
  if (profileId) {
    q = query(eventsRef, where('profileId', '==', profileId));
  }
  
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(doc => doc.data() as EmergencyEvent);
  
  const stats = {
    total: events.length,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    averageResponseTime: 0,
  };
  
  let totalResponseTime = 0;
  let resolvedCount = 0;
  
  events.forEach(event => {
    // Count by type
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    
    // Count by status
    stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
    
    // Calculate response time for resolved events
    if (event.resolvedAt && event.timestamp) {
      const responseTime = event.resolvedAt.getTime() - event.timestamp.getTime();
      totalResponseTime += responseTime;
      resolvedCount++;
    }
  });
  
  if (resolvedCount > 0) {
    stats.averageResponseTime = totalResponseTime / resolvedCount / 1000; // Convert to seconds
  }
  
  return stats;
}
