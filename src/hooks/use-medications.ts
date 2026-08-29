'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import {
  Medication,
  AdherenceRecord,
  getMedications,
  getActiveMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  getAdherenceRecords,
  getProfileAdherenceRecords,
  createAdherenceRecord,
} from '@/firebase/firestore/medications';
import { parseTimingInstructions } from '@/lib/medication-scheduler';
import { MedicationFormData } from '@/components/medications/medication-form';

export function useMedications(userId: string, profileId: string) {
  const firestore = useFirestore();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherenceRecords, setAdherenceRecords] = useState<AdherenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load medications
  const loadMedications = useCallback(async () => {
    if (!firestore || !userId || !profileId) return;

    try {
      setIsLoading(true);
      setError(null);
      const meds = await getMedications(firestore, userId, profileId);
      setMedications(meds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medications');
      console.error('Error loading medications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [firestore, userId, profileId]);

  // Load adherence records
  const loadAdherenceRecords = useCallback(async () => {
    if (!firestore || !userId || !profileId) return;

    try {
      const records = await getProfileAdherenceRecords(firestore, userId, profileId);
      setAdherenceRecords(records);
    } catch (err) {
      console.error('Error loading adherence records:', err);
    }
  }, [firestore, userId, profileId]);

  // Initial load
  useEffect(() => {
    loadMedications();
    loadAdherenceRecords();
  }, [loadMedications, loadAdherenceRecords]);

  // Add medication
  const addMedication = useCallback(
    async (data: MedicationFormData) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required parameters');
      }

      try {
        // Parse instructions
        const parsed = parseTimingInstructions(data.instructions);

        // Create medication
        const medicationId = await createMedication(firestore, userId, profileId, {
          name: data.name,
          dosage: data.dosage,
          frequency: parsed.frequency,
          timing: parsed.timing,
          startDate: data.startDate,
          endDate: data.endDate,
          instructions: data.instructions,
        });

        // Reload medications
        await loadMedications();

        return medicationId;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to add medication');
      }
    },
    [firestore, userId, profileId, loadMedications]
  );

  // Update medication
  const editMedication = useCallback(
    async (medicationId: string, data: MedicationFormData) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required parameters');
      }

      try {
        // Parse instructions
        const parsed = parseTimingInstructions(data.instructions);

        // Update medication
        await updateMedication(firestore, userId, profileId, medicationId, {
          name: data.name,
          dosage: data.dosage,
          frequency: parsed.frequency,
          timing: parsed.timing,
          startDate: data.startDate,
          endDate: data.endDate,
          instructions: data.instructions,
        });

        // Reload medications
        await loadMedications();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to update medication');
      }
    },
    [firestore, userId, profileId, loadMedications]
  );

  // Delete medication
  const removeMedication = useCallback(
    async (medicationId: string) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required parameters');
      }

      try {
        await deleteMedication(firestore, userId, profileId, medicationId);
        await loadMedications();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to delete medication');
      }
    },
    [firestore, userId, profileId, loadMedications]
  );

  // Mark medication as taken
  const markAsTaken = useCallback(
    async (medicationId: string, scheduledTime: Date) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required parameters');
      }

      try {
        await createAdherenceRecord(firestore, userId, profileId, medicationId, {
          medicationId,
          profileId,
          scheduledTime,
          actualTime: new Date(),
          status: 'taken',
          method: 'manual',
        });

        await loadAdherenceRecords();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to mark as taken');
      }
    },
    [firestore, userId, profileId, loadAdherenceRecords]
  );

  // Mark medication as missed
  const markAsMissed = useCallback(
    async (medicationId: string, scheduledTime: Date) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required parameters');
      }

      try {
        await createAdherenceRecord(firestore, userId, profileId, medicationId, {
          medicationId,
          profileId,
          scheduledTime,
          status: 'missed',
          method: 'manual',
        });

        await loadAdherenceRecords();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to mark as missed');
      }
    },
    [firestore, userId, profileId, loadAdherenceRecords]
  );

  // Mark medication as skipped
  const markAsSkipped = useCallback(
    async (medicationId: string, scheduledTime: Date) => {
      if (!firestore || !userId || !profileId) {
        throw new Error('Missing required parameters');
      }

      try {
        await createAdherenceRecord(firestore, userId, profileId, medicationId, {
          medicationId,
          profileId,
          scheduledTime,
          actualTime: new Date(),
          status: 'skipped',
          method: 'manual',
        });

        await loadAdherenceRecords();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to mark as skipped');
      }
    },
    [firestore, userId, profileId, loadAdherenceRecords]
  );

  return {
    medications,
    adherenceRecords,
    isLoading,
    error,
    addMedication,
    editMedication,
    removeMedication,
    markAsTaken,
    markAsMissed,
    markAsSkipped,
    refresh: loadMedications,
  };
}
