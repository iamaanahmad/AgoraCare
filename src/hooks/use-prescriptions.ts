'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { useAuthContext } from '@/contexts/auth-context';
import { useFamily } from '@/contexts/family-context';
import {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
  type Prescription,
} from '@/firebase/firestore/prescriptions';
import type { PrescriptionSummarizerOutput } from '@/ai/flows/prescription-summarizer';

export function usePrescriptions() {
  const firestore = useFirestore();
  const { user } = useAuthContext();
  const { selectedMember: activeProfile } = useFamily();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch prescriptions for active profile
  const fetchPrescriptions = useCallback(async () => {
    if (!firestore || !user || !activeProfile) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getPrescriptions(firestore, user.uid, activeProfile.id);
      setPrescriptions(data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions');
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user, activeProfile]);

  // Load prescriptions on mount and when dependencies change
  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Create a new prescription
  const addPrescription = useCallback(
    async (
      imageUrl: string,
      doctorName: string = '',
      date: Date = new Date()
    ): Promise<string> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required data');
      }

      try {
        const prescriptionId = await createPrescription(firestore, user.uid, activeProfile.id, {
          doctorName,
          date,
          imageUrl,
          ocrText: '',
          summary: {
            plainLanguage: '',
            warnings: [],
            interactions: [],
            specialInstructions: [],
          },
          medications: [],
          processingStatus: 'pending',
        });

        // Refresh prescriptions list
        await fetchPrescriptions();

        return prescriptionId;
      } catch (err) {
        console.error('Error creating prescription:', err);
        throw err;
      }
    },
    [firestore, user, activeProfile, fetchPrescriptions]
  );

  // Update prescription with OCR and AI results
  const updatePrescriptionWithResults = useCallback(
    async (
      prescriptionId: string,
      ocrText: string,
      summary: PrescriptionSummarizerOutput
    ): Promise<void> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required data');
      }

      try {
        await updatePrescription(firestore, user.uid, activeProfile.id, prescriptionId, {
          ocrText,
          summary: {
            plainLanguage: summary.plainLanguageSummary,
            warnings: summary.warnings,
            interactions: summary.interactions,
            specialInstructions: summary.specialInstructions,
          },
          medications: summary.medications.map((med) => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            addedToSchedule: false,
          })),
          doctorName: summary.doctorName || '',
          processingStatus: 'completed',
        });

        // Refresh prescriptions list
        await fetchPrescriptions();
      } catch (err) {
        console.error('Error updating prescription:', err);
        throw err;
      }
    },
    [firestore, user, activeProfile, fetchPrescriptions]
  );

  // Mark prescription as failed
  const markPrescriptionFailed = useCallback(
    async (prescriptionId: string): Promise<void> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required data');
      }

      try {
        await updatePrescription(firestore, user.uid, activeProfile.id, prescriptionId, {
          processingStatus: 'failed',
        });

        // Refresh prescriptions list
        await fetchPrescriptions();
      } catch (err) {
        console.error('Error marking prescription as failed:', err);
        throw err;
      }
    },
    [firestore, user, activeProfile, fetchPrescriptions]
  );

  // Mark medication as added to schedule
  const markMedicationAddedToSchedule = useCallback(
    async (prescriptionId: string, medicationName: string): Promise<void> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required data');
      }

      try {
        // Find the prescription
        const prescription = prescriptions.find((p) => p.id === prescriptionId);
        if (!prescription) {
          throw new Error('Prescription not found');
        }

        // Update the medication
        const updatedMedications = prescription.medications.map((med) =>
          med.name === medicationName ? { ...med, addedToSchedule: true } : med
        );

        await updatePrescription(firestore, user.uid, activeProfile.id, prescriptionId, {
          medications: updatedMedications,
        });

        // Refresh prescriptions list
        await fetchPrescriptions();
      } catch (err) {
        console.error('Error marking medication as added:', err);
        throw err;
      }
    },
    [firestore, user, activeProfile, prescriptions, fetchPrescriptions]
  );

  // Delete a prescription
  const removePrescription = useCallback(
    async (prescriptionId: string): Promise<void> => {
      if (!firestore || !user || !activeProfile) {
        throw new Error('Missing required data');
      }

      try {
        await deletePrescription(firestore, user.uid, activeProfile.id, prescriptionId);

        // Refresh prescriptions list
        await fetchPrescriptions();
      } catch (err) {
        console.error('Error deleting prescription:', err);
        throw err;
      }
    },
    [firestore, user, activeProfile, fetchPrescriptions]
  );

  return {
    prescriptions,
    isLoading,
    error,
    addPrescription,
    updatePrescriptionWithResults,
    markPrescriptionFailed,
    markMedicationAddedToSchedule,
    removePrescription,
    refreshPrescriptions: fetchPrescriptions,
  };
}
