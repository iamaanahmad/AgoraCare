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

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  timing: MedicationTiming[];
  startDate: Date;
  endDate?: Date;
  instructions: string;
  prescriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationFrequency {
  type: 'daily' | 'alternate' | 'weekly' | 'as-needed';
  interval?: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export interface MedicationTiming {
  time: string; // HH:mm format (24-hour)
  relation?: 'before-meal' | 'after-meal' | 'with-meal' | 'bedtime' | 'morning' | 'afternoon' | 'evening';
}

export interface AdherenceRecord {
  id: string;
  medicationId: string;
  profileId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'taken' | 'missed' | 'skipped';
  method: 'manual' | 'voice' | 'auto';
  notes?: string;
  createdAt: Date;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate medication data
 */
export function validateMedication(medication: Partial<Medication>): string[] {
  const errors: string[] = [];

  if (!medication.name || medication.name.trim().length === 0) {
    errors.push('Medication name is required');
  }

  if (!medication.dosage || medication.dosage.trim().length === 0) {
    errors.push('Dosage is required');
  }

  if (!medication.frequency) {
    errors.push('Frequency is required');
  } else {
    if (!['daily', 'alternate', 'weekly', 'as-needed'].includes(medication.frequency.type)) {
      errors.push('Invalid frequency type');
    }

    if (medication.frequency.type === 'weekly' && (!medication.frequency.daysOfWeek || medication.frequency.daysOfWeek.length === 0)) {
      errors.push('Days of week are required for weekly frequency');
    }
  }

  if (!medication.timing || medication.timing.length === 0) {
    errors.push('At least one timing is required');
  } else {
    medication.timing.forEach((timing, index) => {
      if (!timing.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timing.time)) {
        errors.push(`Invalid time format at timing ${index + 1}. Use HH:mm format`);
      }
    });
  }

  if (!medication.startDate) {
    errors.push('Start date is required');
  }

  if (medication.endDate && medication.startDate && medication.endDate < medication.startDate) {
    errors.push('End date must be after start date');
  }

  return errors;
}

/**
 * Validate adherence record
 */
export function validateAdherenceRecord(record: Partial<AdherenceRecord>): string[] {
  const errors: string[] = [];

  if (!record.medicationId) {
    errors.push('Medication ID is required');
  }

  if (!record.profileId) {
    errors.push('Profile ID is required');
  }

  if (!record.scheduledTime) {
    errors.push('Scheduled time is required');
  }

  if (!record.status || !['taken', 'missed', 'skipped'].includes(record.status)) {
    errors.push('Valid status is required (taken, missed, or skipped)');
  }

  if (!record.method || !['manual', 'voice', 'auto'].includes(record.method)) {
    errors.push('Valid method is required (manual, voice, or auto)');
  }

  return errors;
}

// ============================================================================
// Medication CRUD Operations
// ============================================================================

/**
 * Get medication by ID
 */
export async function getMedication(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string
): Promise<Medication | null> {
  const medicationRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications',
    medicationId
  );
  const medicationDoc = await getDoc(medicationRef);

  if (!medicationDoc.exists()) {
    return null;
  }

  const data = medicationDoc.data();
  return {
    ...data,
    startDate: data.startDate?.toDate() || new Date(),
    endDate: data.endDate?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Medication;
}

/**
 * Get all medications for a profile
 */
export async function getMedications(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<Medication[]> {
  // 1. Try profiles subcollection first
  let snapshot = await getDocs(
    collection(firestore, 'users', userId, 'profiles', profileId, 'medications')
  );

  // 2. Fallback to direct patient subcollection (e.g. users/george-patient-profile/medications)
  if (snapshot.empty && profileId) {
    snapshot = await getDocs(
      collection(firestore, 'users', profileId, 'medications')
    );
  }

  // 3. Fallback to user root medications
  if (snapshot.empty && userId) {
    snapshot = await getDocs(
      collection(firestore, 'users', userId, 'medications')
    );
  }

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      frequency: data.frequency || { type: 'daily' },
      timing: data.timing || [{ time: '08:00', relation: 'morning' }],
      startDate: data.startDate?.toDate ? data.startDate.toDate() : (data.startDate ? new Date(data.startDate) : new Date()),
      endDate: data.endDate?.toDate ? data.endDate.toDate() : (data.endDate ? new Date(data.endDate) : undefined),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
    } as Medication;
  });
}

/**
 * Get active medications for a profile (not ended)
 */
export async function getActiveMedications(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<Medication[]> {
  const allMeds = await getMedications(firestore, userId, profileId);
  return allMeds.filter((med) => !med.endDate || med.endDate > new Date());
}

/**
 * Create a new medication
 */
export async function createMedication(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationData: Omit<Medication, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Validate medication data
  const errors = validateMedication({ ...medicationData, profileId });
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const medicationsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications'
  );

  const docRef = await addDoc(medicationsRef, {
    ...medicationData,
    profileId,
    startDate: Timestamp.fromDate(medicationData.startDate),
    endDate: medicationData.endDate ? Timestamp.fromDate(medicationData.endDate) : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update the document with its own ID
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id;
}

/**
 * Update medication
 */
export async function updateMedication(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string,
  updates: Partial<Omit<Medication, 'id' | 'profileId' | 'createdAt'>>
): Promise<void> {
  // Validate updates
  const errors = validateMedication(updates);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const medicationRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications',
    medicationId
  );

  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  if (updates.startDate) {
    updateData.startDate = Timestamp.fromDate(updates.startDate);
  }

  if (updates.endDate) {
    updateData.endDate = Timestamp.fromDate(updates.endDate);
  }

  await updateDoc(medicationRef, updateData);
}

/**
 * Delete medication
 */
export async function deleteMedication(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string
): Promise<void> {
  const medicationRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications',
    medicationId
  );
  await deleteDoc(medicationRef);
}

// ============================================================================
// Adherence Record CRUD Operations
// ============================================================================

/**
 * Get adherence record by ID
 */
export async function getAdherenceRecord(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string,
  recordId: string
): Promise<AdherenceRecord | null> {
  const recordRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications',
    medicationId,
    'adherence',
    recordId
  );
  const recordDoc = await getDoc(recordRef);

  if (!recordDoc.exists()) {
    return null;
  }

  const data = recordDoc.data();
  return {
    ...data,
    scheduledTime: data.scheduledTime?.toDate() || new Date(),
    actualTime: data.actualTime?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
  } as AdherenceRecord;
}

/**
 * Get all adherence records for a medication
 */
export async function getAdherenceRecords(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AdherenceRecord[]> {
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

  let q = query(adherenceRef, orderBy('scheduledTime', 'desc'));

  if (startDate) {
    q = query(q, where('scheduledTime', '>=', Timestamp.fromDate(startDate)));
  }

  if (endDate) {
    q = query(q, where('scheduledTime', '<=', Timestamp.fromDate(endDate)));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      scheduledTime: data.scheduledTime?.toDate() || new Date(),
      actualTime: data.actualTime?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as AdherenceRecord;
  });
}

/**
 * Get adherence records for a profile across all medications
 */
export async function getProfileAdherenceRecords(
  firestore: Firestore,
  userId: string,
  profileId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AdherenceRecord[]> {
  // Get all medications for the profile
  const medications = await getMedications(firestore, userId, profileId);

  // Fetch adherence records for each medication
  const recordsPromises = medications.map((med) =>
    getAdherenceRecords(firestore, userId, profileId, med.id, startDate, endDate)
  );

  const recordsArrays = await Promise.all(recordsPromises);
  const allRecords = recordsArrays.flat();

  // Sort by scheduled time descending
  return allRecords.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
}

/**
 * Create adherence record
 */
export async function createAdherenceRecord(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string,
  recordData: Omit<AdherenceRecord, 'id' | 'createdAt'>
): Promise<string> {
  // Validate record data
  const errors = validateAdherenceRecord(recordData);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

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

  const docRef = await addDoc(adherenceRef, {
    ...recordData,
    scheduledTime: Timestamp.fromDate(recordData.scheduledTime),
    actualTime: recordData.actualTime ? Timestamp.fromDate(recordData.actualTime) : null,
    createdAt: Timestamp.now(),
  });

  // Update the document with its own ID
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id;
}

/**
 * Update adherence record
 */
export async function updateAdherenceRecord(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string,
  recordId: string,
  updates: Partial<Omit<AdherenceRecord, 'id' | 'medicationId' | 'profileId' | 'createdAt'>>
): Promise<void> {
  const recordRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications',
    medicationId,
    'adherence',
    recordId
  );

  const updateData: any = { ...updates };

  if (updates.scheduledTime) {
    updateData.scheduledTime = Timestamp.fromDate(updates.scheduledTime);
  }

  if (updates.actualTime) {
    updateData.actualTime = Timestamp.fromDate(updates.actualTime);
  }

  await updateDoc(recordRef, updateData);
}

/**
 * Delete adherence record
 */
export async function deleteAdherenceRecord(
  firestore: Firestore,
  userId: string,
  profileId: string,
  medicationId: string,
  recordId: string
): Promise<void> {
  const recordRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'medications',
    medicationId,
    'adherence',
    recordId
  );
  await deleteDoc(recordRef);
}
