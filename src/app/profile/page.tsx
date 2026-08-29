'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ProfileForm, ProfileFormData } from '@/components/profile/profile-form';
import { ProfilePreferencesForm } from '@/components/profile/profile-preferences-form';
import { EmergencyContactForm } from '@/components/profile/emergency-contact-form';
import { ProfileSwitcher } from '@/components/profile/profile-switcher';
import { useProfiles } from '@/hooks/use-profiles';
import { useUser } from '@/firebase';
import { UserProfile, EmergencyContact, ProfilePreferences } from '@/firebase/firestore/users';
import { Loader2, Edit, Trash2, ArrowLeft } from 'lucide-react';

export default function ProfileManagementPage() {
  const router = useRouter();
  const { user } = useUser();
  const {
    isLoading,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    updatePreferences,
    addEmergencyContact,
    deleteEmergencyContact,
  } = useProfiles();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Load profiles on mount
  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const fetchedProfiles = await fetchProfiles();
      setProfiles(fetchedProfiles);
      
      // Set first profile as active if none selected
      if (fetchedProfiles.length > 0 && !activeProfile) {
        setActiveProfile(fetchedProfiles[0]);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleCreateProfile = async (data: ProfileFormData) => {
    try {
      const profileId = await createProfile(data);
      await loadProfiles();
      setIsCreateDialogOpen(false);
      
      // Switch to newly created profile
      const newProfile = profiles.find(p => p.id === profileId);
      if (newProfile) {
        setActiveProfile(newProfile);
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!editingProfile) return;

    try {
      await updateProfile(editingProfile.id, data);
      await loadProfiles();
      setIsEditDialogOpen(false);
      setEditingProfile(null);
      
      // Update active profile if it was edited
      if (activeProfile?.id === editingProfile.id) {
        const updatedProfile = profiles.find(p => p.id === editingProfile.id);
        if (updatedProfile) {
          setActiveProfile(updatedProfile);
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteProfile(profileId);
      await loadProfiles();
      
      // Switch to another profile if active was deleted
      if (activeProfile?.id === profileId && profiles.length > 1) {
        const remainingProfile = profiles.find(p => p.id !== profileId);
        if (remainingProfile) {
          setActiveProfile(remainingProfile);
        }
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleProfileSelect = async (profile: UserProfile) => {
    setActiveProfile(profile);
    await switchProfile(profile.id);
  };

  const handleUpdatePreferences = async (preferences: ProfilePreferences) => {
    if (!activeProfile) return;

    try {
      await updatePreferences(activeProfile.id, preferences);
      await loadProfiles();
      
      // Update active profile with new preferences
      const updatedProfile = profiles.find(p => p.id === activeProfile.id);
      if (updatedProfile) {
        setActiveProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleAddEmergencyContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    if (!activeProfile) return;

    try {
      await addEmergencyContact(activeProfile.id, contact);
      await loadProfiles();
      
      // Update active profile with new contacts
      const updatedProfile = profiles.find(p => p.id === activeProfile.id);
      if (updatedProfile) {
        setActiveProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
    }
  };

  const handleDeleteEmergencyContact = async (contactId: string) => {
    if (!activeProfile) return;

    try {
      await deleteEmergencyContact(activeProfile.id, contactId);
      await loadProfiles();
      
      // Update active profile
      const updatedProfile = profiles.find(p => p.id === activeProfile.id);
      if (updatedProfile) {
        setActiveProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to delete emergency contact:', error);
    }
  };

  if (loadingProfiles) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to AgoraCare</CardTitle>
            <CardDescription>
              Let's create your first profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              onSubmit={handleCreateProfile}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Management</h1>
          <p className="text-muted-foreground">
            Manage family member profiles, preferences, and emergency contacts
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Profile Switcher */}
      <ProfileSwitcher
        profiles={profiles}
        activeProfile={activeProfile!}
        onProfileSelect={handleProfileSelect}
        onAddProfile={() => setIsCreateDialogOpen(true)}
      />

      {/* Profile Management Tabs */}
      {activeProfile && (
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Profile Info</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
          </TabsList>

          {/* Profile Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      View and manage {activeProfile.name}'s profile details
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProfile(activeProfile);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    {profiles.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {activeProfile.name}'s profile?
                              This will permanently remove all associated data including medications,
                              appointments, and prescriptions. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProfile(activeProfile.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Profile
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-lg">{activeProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Age Category</p>
                    <p className="text-lg capitalize">{activeProfile.ageCategory}</p>
                  </div>
                  {activeProfile.dateOfBirth && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-lg">
                        {new Date(activeProfile.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profile Created</p>
                    <p className="text-lg">
                      {new Date(activeProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <ProfilePreferencesForm
              preferences={activeProfile.preferences}
              onSubmit={handleUpdatePreferences}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Emergency Contacts Tab */}
          <TabsContent value="emergency">
            <EmergencyContactForm
              contacts={activeProfile.emergencyContacts}
              onAdd={handleAddEmergencyContact}
              onUpdate={async () => {}} // Not implemented in this version
              onDelete={handleDeleteEmergencyContact}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Create Profile Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Add a new family member profile to manage their healthcare
            </DialogDescription>
          </DialogHeader>
          <ProfileForm
            onSubmit={handleCreateProfile}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update profile information for {editingProfile?.name}
            </DialogDescription>
          </DialogHeader>
          {editingProfile && (
            <ProfileForm
              profile={editingProfile}
              onSubmit={handleUpdateProfile}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingProfile(null);
              }}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
