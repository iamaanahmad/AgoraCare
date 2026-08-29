'use client';

import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { EmergencyContact } from './users';

/**
 * Add emergency contact to a user profile
 */
export async function addEmergencyContact(
  firestore: Firestore,
  userId: string,
  profileId: string,
  contact: Omit<EmergencyContact, 'id'>
): Promise<string> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  
  // Generate unique ID for the contact
  const contactId = `ec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newContact: EmergencyContact = {
    ...contact,
    id: contactId,
  };
  
  await updateDoc(profileRef, {
    emergencyContacts: arrayUnion(newContact),
    updatedAt: Timestamp.now(),
  });
  
  return contactId;
}

/**
 * Update emergency contact in a user profile
 */
export async function updateEmergencyContact(
  firestore: Firestore,
  userId: string,
  profileId: string,
  contactId: string,
  updates: Partial<Omit<EmergencyContact, 'id'>>
): Promise<void> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) {
    throw new Error('Profile not found');
  }
  
  const profileData = profileDoc.data();
  const contacts = profileData.emergencyContacts || [];
  
  // Find and update the contact
  const updatedContacts = contacts.map((contact: EmergencyContact) => {
    if (contact.id === contactId) {
      return { ...contact, ...updates };
    }
    return contact;
  });
  
  await updateDoc(profileRef, {
    emergencyContacts: updatedContacts,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete emergency contact from a user profile
 */
export async function deleteEmergencyContact(
  firestore: Firestore,
  userId: string,
  profileId: string,
  contactId: string
): Promise<void> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) {
    throw new Error('Profile not found');
  }
  
  const profileData = profileDoc.data();
  const contacts = profileData.emergencyContacts || [];
  
  // Find the contact to remove
  const contactToRemove = contacts.find((c: EmergencyContact) => c.id === contactId);
  
  if (contactToRemove) {
    await updateDoc(profileRef, {
      emergencyContacts: arrayRemove(contactToRemove),
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Get all emergency contacts for a profile
 */
export async function getEmergencyContacts(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<EmergencyContact[]> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) {
    return [];
  }
  
  const profileData = profileDoc.data();
  return (profileData.emergencyContacts || []) as EmergencyContact[];
}

/**
 * Get emergency contacts sorted by priority
 */
export async function getEmergencyContactsByPriority(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<EmergencyContact[]> {
  const contacts = await getEmergencyContacts(firestore, userId, profileId);
  return contacts.sort((a, b) => a.priority - b.priority);
}

/**
 * Reorder emergency contact priorities
 */
export async function reorderEmergencyContacts(
  firestore: Firestore,
  userId: string,
  profileId: string,
  contactIds: string[]
): Promise<void> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) {
    throw new Error('Profile not found');
  }
  
  const profileData = profileDoc.data();
  const contacts = profileData.emergencyContacts || [];
  
  // Update priorities based on the order in contactIds array
  const updatedContacts = contacts.map((contact: EmergencyContact) => {
    const newPriority = contactIds.indexOf(contact.id);
    if (newPriority !== -1) {
      return { ...contact, priority: newPriority + 1 };
    }
    return contact;
  });
  
  await updateDoc(profileRef, {
    emergencyContacts: updatedContacts,
    updatedAt: Timestamp.now(),
  });
}
