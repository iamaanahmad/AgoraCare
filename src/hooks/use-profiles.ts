'use client';

import { useState, useCallback } from 'react';
import { useFirestore, useUser } from '@/firebase';
import {
  getUserProfiles,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  setActiveProfile,
  UserProfile,
  EmergencyContact,
  ProfilePreferences,
  getDefaultPreferences,
} from '@/firebase/firestore/users';
import { useToast } from '@/hooks/use-toast';

export function useProfiles() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch all profiles for the current user
   */
  const fetchProfiles = useCallback(async (): Promise<UserProfile[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      const profiles = await getUserProfiles(firestore, user.uid);
      return profiles;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profiles. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user, toast]);

  /**
   * Create a new profile
   */
  const createProfile = useCallback(
    async (profileData: {
      name: string;
      dateOfBirth?: Date;
      ageCategory: 'child' | 'adult' | 'elder';
      avatar?: string;
    }): Promise<string> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        const profileId = await createUserProfile(firestore, user.uid, {
          name: profileData.name,
          dateOfBirth: profileData.dateOfBirth,
          ageCategory: profileData.ageCategory,
          avatar: profileData.avatar,
          emergencyContacts: [],
          preferences: getDefaultPreferences(),
        });

        toast({
          title: 'Success',
          description: `Profile for ${profileData.name} created successfully.`,
        });

        return profileId;
      } catch (error) {
        console.error('Error creating profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to create profile. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  /**
   * Update an existing profile
   */
  const updateProfile = useCallback(
    async (
      profileId: string,
      updates: {
        name?: string;
        dateOfBirth?: Date;
        ageCategory?: 'child' | 'adult' | 'elder';
        avatar?: string;
      }
    ): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        await updateUserProfile(firestore, user.uid, profileId, updates);

        toast({
          title: 'Success',
          description: 'Profile updated successfully.',
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  /**
   * Delete a profile
   */
  const deleteProfile = useCallback(
    async (profileId: string): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        await deleteUserProfile(firestore, user.uid, profileId);

        toast({
          title: 'Success',
          description: 'Profile deleted successfully.',
        });
      } catch (error) {
        console.error('Error deleting profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete profile. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  /**
   * Set the active profile
   */
  const switchProfile = useCallback(
    async (profileId: string): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        await setActiveProfile(firestore, user.uid, profileId);

        toast({
          title: 'Profile Switched',
          description: 'Active profile changed successfully.',
        });
      } catch (error) {
        console.error('Error switching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to switch profile. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  /**
   * Update profile preferences
   */
  const updatePreferences = useCallback(
    async (profileId: string, preferences: ProfilePreferences): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        await updateUserProfile(firestore, user.uid, profileId, { preferences });

        toast({
          title: 'Success',
          description: 'Preferences updated successfully.',
        });
      } catch (error) {
        console.error('Error updating preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to update preferences. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  /**
   * Add emergency contact to profile
   */
  const addEmergencyContact = useCallback(
    async (profileId: string, contact: Omit<EmergencyContact, 'id'>): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        // Fetch current profile
        const profiles = await getUserProfiles(firestore, user.uid);
        const profile = profiles.find((p) => p.id === profileId);

        if (!profile) {
          throw new Error('Profile not found');
        }

        // Add new contact with generated ID
        const newContact: EmergencyContact = {
          ...contact,
          id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        const updatedContacts = [...profile.emergencyContacts, newContact];

        await updateUserProfile(firestore, user.uid, profileId, {
          emergencyContacts: updatedContacts,
        });

        toast({
          title: 'Success',
          description: 'Emergency contact added successfully.',
        });
      } catch (error) {
        console.error('Error adding emergency contact:', error);
        toast({
          title: 'Error',
          description: 'Failed to add emergency contact. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  /**
   * Update emergency contact
   */
  const updateEmergencyContact = useCallback(
    async (
      profileId: string,
      contactId: string,
      updates: Partial<EmergencyContact>
    ): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        // Fetch current profile
        const profiles = await getUserProfiles(firestore, user.uid);
        const profile = profiles.find((p) => p.id === profileId);

        if (!profile) {
          throw new Error('Profile not found');
        }

        // Update contact
        const updatedContacts = profile.emergencyContacts.map((contact) =>
          contact.id === contactId ? { ...contact, ...updates } : contact
        );

        await updateUserProfile(firestore, user.uid, profileId, {
          emergencyContacts: updatedContacts,
        });

        toast({
          title: 'Success',
          description: 'Emergency contact updated successfully.',
        });
      } catch (error) {
        console.error('Error updating emergency contact:', error);
        toast({
          title: 'Error',
          description: 'Failed to update emergency contact. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  /**
   * Delete emergency contact
   */
  const deleteEmergencyContact = useCallback(
    async (profileId: string, contactId: string): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      try {
        // Fetch current profile
        const profiles = await getUserProfiles(firestore, user.uid);
        const profile = profiles.find((p) => p.id === profileId);

        if (!profile) {
          throw new Error('Profile not found');
        }

        // Remove contact
        const updatedContacts = profile.emergencyContacts.filter(
          (contact) => contact.id !== contactId
        );

        await updateUserProfile(firestore, user.uid, profileId, {
          emergencyContacts: updatedContacts,
        });

        toast({
          title: 'Success',
          description: 'Emergency contact removed successfully.',
        });
      } catch (error) {
        console.error('Error deleting emergency contact:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete emergency contact. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  return {
    isLoading,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    updatePreferences,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
  };
}
