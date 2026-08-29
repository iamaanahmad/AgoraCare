'use client';

import {
  collection,
  query,
  onSnapshot,
  Unsubscribe,
  Firestore,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { DashboardData, ProfileHealthSummary, MedicationScheduleItem, HealthAlert } from './dashboard-aggregation-service';

// ============================================================================
// Type Definitions
// ============================================================================

export type DashboardUpdateCallback = (data: Partial<DashboardData>) => void;
export type ProfileUpdateCallback = (profileId: string, summary: ProfileHealthSummary) => void;
export type AlertCallback = (alerts: HealthAlert[]) => void;

interface SubscriptionManager {
  unsubscribeAll: () => void;
  isActive: boolean;
}

// ============================================================================
// Real-Time Subscription Service
// ============================================================================

/**
 * Subscribe to real-time dashboard updates
 */
export function subscribeToDashboardUpdates(
  firestore: Firestore,
  userId: string,
  callback: DashboardUpdateCallback
): SubscriptionManager {
  const unsubscribers: Unsubscribe[] = [];
  let isActive = true;

  // Subscribe to user profiles
  const profilesRef = collection(firestore, 'users', userId, 'profiles');
  const profilesUnsubscribe = onSnapshot(
    profilesRef,
    (snapshot) => {
      if (!isActive) return;

      const profiles = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          dateOfBirth: data.dateOfBirth?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });

      callback({ profiles: [] }); // Trigger re-aggregation
    },
    (error) => {
      console.error('Error subscribing to profiles:', error);
    }
  );

  unsubscribers.push(profilesUnsubscribe);

  return {
    unsubscribeAll: () => {
      isActive = false;
      unsubscribers.forEach(unsub => unsub());
    },
    isActive,
  };
}

/**
 * Subscribe to medication updates for a specific profile
 */
export function subscribeToProfileMedications(
  firestore: Firestore,
  userId: string,
  profileId: string,
  callback: () => void
): Unsubscribe {
  const medicationsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications'
  );

  return onSnapshot(
    medicationsRef,
    () => {
      callback();
    },
    (error) => {
      console.error('Error subscribing to medications:', error);
    }
  );
}

/**
 * Subscribe to appointment updates for a specific profile
 */
export function subscribeToProfileAppointments(
  firestore: Firestore,
  userId: string,
  profileId: string,
  callback: () => void
): Unsubscribe {
  const appointmentsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments'
  );

  return onSnapshot(
    appointmentsRef,
    () => {
      callback();
    },
    (error) => {
      console.error('Error subscribing to appointments:', error);
    }
  );
}

/**
 * Subscribe to adherence record updates for a specific profile
 */
export function subscribeToProfileAdherence(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string,
  callback: () => void
): Unsubscribe {
  const adherenceRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications',
    medicationId,
    'adherence'
  );

  return onSnapshot(
    adherenceRef,
    () => {
      callback();
    },
    (error) => {
      console.error('Error subscribing to adherence records:', error);
    }
  );
}

/**
 * Subscribe to all profile updates (medications, appointments, adherence)
 */
export function subscribeToAllProfileUpdates(
  firestore: Firestore,
  userId: string,
  profileIds: string[],
  callback: () => void
): SubscriptionManager {
  const unsubscribers: Unsubscribe[] = [];
  let isActive = true;

  for (const profileId of profileIds) {
    // Subscribe to medications
    const medUnsub = subscribeToProfileMedications(firestore, userId, profileId, () => {
      if (isActive) callback();
    });
    unsubscribers.push(medUnsub);

    // Subscribe to appointments
    const apptUnsub = subscribeToProfileAppointments(firestore, userId, profileId, () => {
      if (isActive) callback();
    });
    unsubscribers.push(apptUnsub);
  }

  return {
    unsubscribeAll: () => {
      isActive = false;
      unsubscribers.forEach(unsub => unsub());
    },
    isActive,
  };
}

/**
 * Subscribe to today's medication schedule updates
 */
export function subscribeToTodaysMedications(
  firestore: Firestore,
  userId: string,
  profileIds: string[],
  callback: () => void
): SubscriptionManager {
  const unsubscribers: Unsubscribe[] = [];
  let isActive = true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const profileId of profileIds) {
    // Subscribe to medications for each profile
    const medicationsRef = collection(
      firestore,
      'users',
      userId,
      'profiles',
      profileId,
      'medications'
    );

    const medUnsub = onSnapshot(
      medicationsRef,
      () => {
        if (isActive) callback();
      },
      (error) => {
        console.error('Error subscribing to medications:', error);
      }
    );

    unsubscribers.push(medUnsub);

    // Subscribe to today's adherence records
    // Note: We need to subscribe to all medications' adherence subcollections
    // This is a simplified version - in production, you might want to optimize this
  }

  return {
    unsubscribeAll: () => {
      isActive = false;
      unsubscribers.forEach(unsub => unsub());
    },
    isActive,
  };
}

/**
 * Subscribe to upcoming appointments
 */
export function subscribeToUpcomingAppointments(
  firestore: Firestore,
  userId: string,
  profileIds: string[],
  callback: () => void
): SubscriptionManager {
  const unsubscribers: Unsubscribe[] = [];
  let isActive = true;

  const now = Timestamp.now();

  for (const profileId of profileIds) {
    const appointmentsRef = collection(
      firestore,
      'users',
      userId,
      'profiles',
      profileId,
      'appointments'
    );

    const q = query(
      appointmentsRef,
      where('status', '==', 'scheduled'),
      where('dateTime', '>=', now),
      orderBy('dateTime', 'asc')
    );

    const apptUnsub = onSnapshot(
      q,
      () => {
        if (isActive) callback();
      },
      (error) => {
        console.error('Error subscribing to upcoming appointments:', error);
      }
    );

    unsubscribers.push(apptUnsub);
  }

  return {
    unsubscribeAll: () => {
      isActive = false;
      unsubscribers.forEach(unsub => unsub());
    },
    isActive,
  };
}

/**
 * Create a comprehensive real-time dashboard subscription
 */
export function createDashboardSubscription(
  firestore: Firestore,
  userId: string,
  profileIds: string[],
  onUpdate: () => void
): SubscriptionManager {
  const subscriptions: SubscriptionManager[] = [];

  // Subscribe to all profile updates
  const profileSub = subscribeToAllProfileUpdates(firestore, userId, profileIds, onUpdate);
  subscriptions.push(profileSub);

  // Subscribe to today's medications
  const medSub = subscribeToTodaysMedications(firestore, userId, profileIds, onUpdate);
  subscriptions.push(medSub);

  // Subscribe to upcoming appointments
  const apptSub = subscribeToUpcomingAppointments(firestore, userId, profileIds, onUpdate);
  subscriptions.push(apptSub);

  return {
    unsubscribeAll: () => {
      subscriptions.forEach(sub => sub.unsubscribeAll());
    },
    isActive: true,
  };
}
