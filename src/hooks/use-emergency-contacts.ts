'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { EmergencyContact } from '@/firebase/firestore/users';
import {
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContactsByPriority,
  reorderEmergencyContacts,
} from '@/firebase/firestore/emergency-contacts';

export function useEmergencyContacts(userId: string | undefined, profileId: string | undefined) {
  const firestore = useFirestore();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch emergency contacts
  const fetchContacts = useCallback(async () => {
    if (!userId || !profileId) {
      setContacts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fetchedContacts = await getEmergencyContactsByPriority(firestore, userId, profileId);
      setContacts(fetchedContacts);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching emergency contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [firestore, userId, profileId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Add new emergency contact
  const addContact = useCallback(
    async (contact: Omit<EmergencyContact, 'id'>) => {
      if (!userId || !profileId) {
        throw new Error('User ID and Profile ID are required');
      }

      try {
        setError(null);
        const contactId = await addEmergencyContact(firestore, userId, profileId, contact);
        await fetchContacts(); // Refresh the list
        return contactId;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [firestore, userId, profileId, fetchContacts]
  );

  // Update existing emergency contact
  const updateContact = useCallback(
    async (contactId: string, updates: Partial<Omit<EmergencyContact, 'id'>>) => {
      if (!userId || !profileId) {
        throw new Error('User ID and Profile ID are required');
      }

      try {
        setError(null);
        await updateEmergencyContact(firestore, userId, profileId, contactId, updates);
        await fetchContacts(); // Refresh the list
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [firestore, userId, profileId, fetchContacts]
  );

  // Delete emergency contact
  const deleteContact = useCallback(
    async (contactId: string) => {
      if (!userId || !profileId) {
        throw new Error('User ID and Profile ID are required');
      }

      try {
        setError(null);
        await deleteEmergencyContact(firestore, userId, profileId, contactId);
        await fetchContacts(); // Refresh the list
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [firestore, userId, profileId, fetchContacts]
  );

  // Reorder contacts by priority
  const reorderContacts = useCallback(
    async (contactIds: string[]) => {
      if (!userId || !profileId) {
        throw new Error('User ID and Profile ID are required');
      }

      try {
        setError(null);
        await reorderEmergencyContacts(firestore, userId, profileId, contactIds);
        await fetchContacts(); // Refresh the list
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [firestore, userId, profileId, fetchContacts]
  );

  return {
    contacts,
    isLoading,
    error,
    addContact,
    updateContact,
    deleteContact,
    reorderContacts,
    refreshContacts: fetchContacts,
  };
}
