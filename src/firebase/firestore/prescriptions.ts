'use client';

import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Prescription {
  id: string;
  profileId: string;
  doctorName: string;
  date: Date;
  imageUrl: string;
  ocrText: string;
  summary: PrescriptionSummary;
  medications: PrescriptionMedication[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionSummary {
  plainLanguage: string;
  warnings: string[];
  interactions: string[];
  specialInstructions: string[];
}

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  addedToSchedule: boolean;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate prescription data
 */
export function validatePrescription(prescription: Partial<Prescription>): string[] {
  const errors: string[] = [];

  if (!prescription.profileId) {
    errors.push('Profile ID is required');
  }

  if (!prescription.imageUrl || prescription.imageUrl.trim().length === 0) {
    errors.push('Image URL is required');
  }

  if (!prescription.date) {
    errors.push('Prescription date is required');
  }

  return errors;
}

// ============================================================================
// Prescription CRUD Operations
// ============================================================================

/**
 * Get prescription by ID
 */
export async function getPrescription(
  firestore: Firestore,
  userId: string,
  profileId: string,
  prescriptionId: string
): Promise<Prescription | null> {
  const prescriptionRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'prescriptions',
    prescriptionId
  );
  const prescriptionDoc = await getDoc(prescriptionRef);

  if (!prescriptionDoc.exists()) {
    return null;
  }

  const data = prescriptionDoc.data();
  return {
    ...data,
    date: data.date?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Prescription;
}

/**
 * Get all prescriptions for a profile
 */
export async function getPrescriptions(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<Prescription[]> {
  const prescriptionsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'prescriptions'
  );
  const q = query(prescriptionsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Prescription;
  });
}

/**
 * Create a new prescription
 */
export async function createPrescription(
  firestore: Firestore,
  userId: string,
  profileId: string,
  prescriptionData: Omit<Prescription, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Validate prescription data
  const errors = validatePrescription({ ...prescriptionData, profileId });
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const prescriptionsRef = collection(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'prescriptions'
  );

  const docRef = await addDoc(prescriptionsRef, {
    ...prescriptionData,
    profileId,
    date: Timestamp.fromDate(prescriptionData.date),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update the document with its own ID
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id;
}

/**
 * Update prescription
 */
export async function updatePrescription(
  firestore: Firestore,
  userId: string,
  profileId: string,
  prescriptionId: string,
  updates: Partial<Omit<Prescription, 'id' | 'profileId' | 'createdAt'>>
): Promise<void> {
  const prescriptionRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'prescriptions',
    prescriptionId
  );

  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date);
  }

  await updateDoc(prescriptionRef, updateData);
}

/**
 * Delete prescription
 */
export async function deletePrescription(
  firestore: Firestore,
  userId: string,
  profileId: string,
  prescriptionId: string
): Promise<void> {
  const prescriptionRef = doc(
    firestore,
    'users',
    userId,
    'profiles',
    profileId,
    'prescriptions',
    prescriptionId
  );
  await deleteDoc(prescriptionRef);
}
