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
  DocumentReference
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  role: 'user' | 'caregiver';
  activeProfileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  dateOfBirth?: Date;
  ageCategory: 'child' | 'adult' | 'elder';
  avatar?: string;
  emergencyContacts: EmergencyContact[];
  preferences: ProfilePreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  priority: number;
  notificationPreference: 'call' | 'sms' | 'both';
}

export interface ProfilePreferences {
  voiceEnabled: boolean;
  voiceLanguage: string;
  notificationSound: boolean;
  notificationVibration: boolean;
  reminderLeadTime: number;
  accessibilityMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

/**
 * Get user document by ID
 */
export async function getUser(
  firestore: Firestore,
  userId: string
): Promise<User | null> {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const data = userDoc.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as User;
}

/**
 * Create a new user document
 */
export async function createUser(
  firestore: Firestore,
  userId: string,
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    id: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update user document
 */
export async function updateUser(
  firestore: Firestore,
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete user document
 */
export async function deleteUser(
  firestore: Firestore,
  userId: string
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await deleteDoc(userRef);
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<UserProfile | null> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) {
    return null;
  }
  
  const data = profileDoc.data();
  return {
    ...data,
    dateOfBirth: data.dateOfBirth?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as UserProfile;
}

/**
 * Get all profiles for a user
 */
export async function getUserProfiles(
  firestore: Firestore,
  userId: string
): Promise<UserProfile[]> {
  const profilesRef = collection(firestore, 'users', userId, 'profiles');
  const snapshot = await getDocs(profilesRef);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      dateOfBirth: data.dateOfBirth?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile;
  });
}

/**
 * Create a new user profile
 */
export async function createUserProfile(
  firestore: Firestore,
  userId: string,
  profileData: Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const profilesRef = collection(firestore, 'users', userId, 'profiles');
  const newProfileRef = doc(profilesRef);
  
  await setDoc(newProfileRef, {
    ...profileData,
    id: newProfileRef.id,
    userId,
    dateOfBirth: profileData.dateOfBirth ? Timestamp.fromDate(profileData.dateOfBirth) : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  return newProfileRef.id;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  firestore: Firestore,
  userId: string,
  profileId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  
  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  
  if (updates.dateOfBirth) {
    updateData.dateOfBirth = Timestamp.fromDate(updates.dateOfBirth);
  }
  
  await updateDoc(profileRef, updateData);
}

/**
 * Delete user profile
 */
export async function deleteUserProfile(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<void> {
  const profileRef = doc(firestore, 'users', userId, 'profiles', profileId);
  await deleteDoc(profileRef);
}

/**
 * Set active profile for user
 */
export async function setActiveProfile(
  firestore: Firestore,
  userId: string,
  profileId: string
): Promise<void> {
  await updateUser(firestore, userId, { activeProfileId: profileId });
}

/**
 * Get default profile preferences
 */
export function getDefaultPreferences(): ProfilePreferences {
  return {
    voiceEnabled: true,
    voiceLanguage: 'en-US',
    notificationSound: true,
    notificationVibration: true,
    reminderLeadTime: 15,
    accessibilityMode: false,
    fontSize: 'medium',
  };
}
