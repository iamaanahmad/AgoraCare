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
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Appointment {
  id: string;
  profileId: string;
  doctorName: string;
  specialization: string;
  dateTime: Date;
  duration: number; // minutes
  location: string;
  symptoms?: string[];
  notes?: string;
  calendarEventId?: string;
  calendarProvider?: 'google' | 'outlook';
  remindersSent: boolean[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  createdAt: Date;
  updatedAt: Date;
}

export interface SymptomAnalysis {
  symptoms: string[];
  severity: 'low' | 'medium' | 'high' | 'emergency';
  recommendedSpecializations: string[];
  urgency: 'routine' | 'urgent' | 'emergency';
}

export interface CalendarSync {
  provider: 'google' | 'outlook';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  lastSyncAt: Date;
  syncEnabled: boolean;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate appointment data
 */
export function validateAppointment(appointment: Partial<Appointment>): string[] {
  const errors: string[] = [];

  if (!appointment.doctorName || appointment.doctorName.trim().length === 0) {
    errors.push('Doctor name is required');
  }

  if (!appointment.specialization || appointment.specialization.trim().length === 0) {
    errors.push('Specialization is required');
  }

  if (!appointment.dateTime) {
    errors.push('Date and time are required');
  } else if (appointment.dateTime < new Date()) {
    errors.push('Appointment date must be in the future');
  }

  if (!appointment.duration || appointment.duration <= 0) {
    errors.push('Duration must be a positive number');
  }

  if (!appointment.location || appointment.location.trim().length === 0) {
    errors.push('Location is required');
  }

  if (!appointment.status || !['scheduled', 'completed', 'cancelled', 'no-show'].includes(appointment.status)) {
    errors.push('Valid status is required');
  }

  return errors;
}

/**
 * Check for appointment conflicts
 */
export async function checkAppointmentConflicts(
  firestore: Firestore,
  userId: string,
  profileId: string,
  dateTime: Date,
  duration: number,
  excludeAppointmentId?: string
): Promise<Appointment[]> {
  const appointmentsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments'
  );

  // Calculate time range
  const startTime = new Date(dateTime);
  const endTime = new Date(dateTime.getTime() + duration * 60000);

  // Query appointments that might conflict
  const q = query(
    appointmentsRef,
    where('status', '==', 'scheduled'),
    orderBy('dateTime', 'asc')
  );

  const snapshot = await getDocs(q);
  const conflicts: Appointment[] = [];

  snapshot.docs.forEach((doc) => {
    if (excludeAppointmentId && doc.id === excludeAppointmentId) {
      return;
    }

    const data = doc.data();
    const apptStart = data.dateTime?.toDate() || new Date();
    const apptEnd = new Date(apptStart.getTime() + (data.duration || 30) * 60000);

    // Check for overlap
    if (
      (startTime >= apptStart && startTime < apptEnd) ||
      (endTime > apptStart && endTime <= apptEnd) ||
      (startTime <= apptStart && endTime >= apptEnd)
    ) {
      conflicts.push({
        ...data,
        dateTime: apptStart,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Appointment);
    }
  });

  return conflicts;
}

// ============================================================================
// Appointment CRUD Operations
// ============================================================================

/**
 * Get appointment by ID
 */
export async function getAppointment(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const appointmentRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments',
    appointmentId
  );
  const appointmentDoc = await getDoc(appointmentRef);

  if (!appointmentDoc.exists()) {
    return null;
  }

  const data = appointmentDoc.data();
  return {
    ...data,
    dateTime: data.dateTime?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Appointment;
}

/**
 * Get all appointments for a profile
 */
export async function getAppointments(
  firestore: Firestore,
  userId: string,
  profileId: string,
  status?: Appointment['status']
): Promise<Appointment[]> {
  const appointmentsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments'
  );

  let q = query(appointmentsRef, orderBy('dateTime', 'desc'));

  if (status) {
    q = query(appointmentsRef, where('status', '==', status), orderBy('dateTime', 'desc'));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      dateTime: data.dateTime?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Appointment;
  });
}

/**
 * Get upcoming appointments for a profile
 */
export async function getUpcomingAppointments(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<Appointment[]> {
  const appointmentsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments'
  );

  const now = Timestamp.now();
  const q = query(
    appointmentsRef,
    where('status', '==', 'scheduled'),
    where('dateTime', '>=', now),
    orderBy('dateTime', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      dateTime: data.dateTime?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Appointment;
  });
}

/**
 * Get appointments within a date range
 */
export async function getAppointmentsByDateRange(
  firestore: Firestore,
  userId: string,
  profileId: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
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
    where('dateTime', '>=', Timestamp.fromDate(startDate)),
    where('dateTime', '<=', Timestamp.fromDate(endDate)),
    orderBy('dateTime', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      dateTime: data.dateTime?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Appointment;
  });
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentData: Omit<Appointment, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Validate appointment data
  const errors = validateAppointment({ ...appointmentData, profileId });
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // Check for conflicts
  const conflicts = await checkAppointmentConflicts(
    firestore,
    userId,
    profileId,
    appointmentData.dateTime,
    appointmentData.duration
  );

  if (conflicts.length > 0) {
    throw new Error(
      `Appointment conflicts with existing appointment at ${conflicts[0].dateTime.toLocaleString()}`
    );
  }

  const appointmentsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments'
  );

  const docRef = await addDoc(appointmentsRef, {
    ...appointmentData,
    profileId,
    dateTime: Timestamp.fromDate(appointmentData.dateTime),
    remindersSent: appointmentData.remindersSent || [false, false],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update the document with its own ID
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id;
}

/**
 * Update appointment
 */
export async function updateAppointment(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string,
  updates: Partial<Omit<Appointment, 'id' | 'profileId' | 'createdAt'>>
): Promise<void> {
  // Validate updates
  const errors = validateAppointment(updates);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // Check for conflicts if date/time or duration is being updated
  if (updates.dateTime || updates.duration) {
    const currentAppointment = await getAppointment(firestore, userId, profileId, appointmentId);
    if (!currentAppointment) {
      throw new Error('Appointment not found');
    }

    const newDateTime = updates.dateTime || currentAppointment.dateTime;
    const newDuration = updates.duration || currentAppointment.duration;

    const conflicts = await checkAppointmentConflicts(
      firestore,
      userId,
      profileId,
      newDateTime,
      newDuration,
      appointmentId
    );

    if (conflicts.length > 0) {
      throw new Error(
        `Appointment conflicts with existing appointment at ${conflicts[0].dateTime.toLocaleString()}`
      );
    }
  }

  const appointmentRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments',
    appointmentId
  );

  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  if (updates.dateTime) {
    updateData.dateTime = Timestamp.fromDate(updates.dateTime);
  }

  await updateDoc(appointmentRef, updateData);
}

/**
 * Delete appointment
 */
export async function deleteAppointment(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string
): Promise<void> {
  const appointmentRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'appointments',
    appointmentId
  );
  await deleteDoc(appointmentRef);
}

/**
 * Cancel appointment (soft delete)
 */
export async function cancelAppointment(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string
): Promise<void> {
  await updateAppointment(firestore, userId, profileId, appointmentId, {
    status: 'cancelled',
  });
}

/**
 * Mark appointment as completed
 */
export async function completeAppointment(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string
): Promise<void> {
  await updateAppointment(firestore, userId, profileId, appointmentId, {
    status: 'completed',
  });
}

/**
 * Mark appointment as no-show
 */
export async function markAppointmentNoShow(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string
): Promise<void> {
  await updateAppointment(firestore, userId, profileId, appointmentId, {
    status: 'no-show',
  });
}

/**
 * Update reminder sent status
 */
export async function updateReminderSent(
  firestore: Firestore,
  userId: string,
  profileId: string,
  appointmentId: string,
  reminderIndex: number
): Promise<void> {
  const appointment = await getAppointment(firestore, userId, profileId, appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const remindersSent = [...appointment.remindersSent];
  remindersSent[reminderIndex] = true;

  await updateAppointment(firestore, userId, profileId, appointmentId, {
    remindersSent,
  });
}
