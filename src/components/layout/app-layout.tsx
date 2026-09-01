'use client';

import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { FamilyProvider } from '@/contexts/family-context';
import { useUser, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn, useAuth } from '@/firebase';
import { doc, setDoc, getDoc, collection, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { initialAppointments, initialMedications, initialVitals } from '@/lib/data';

async function seedInitialData(userId: string, firestore: any) {
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists() && userDoc.data().hasBeenSeeded) {
    return;
  }

  const batch = writeBatch(firestore);

  // 1. Create Sara (Caregiver) profile for the current user
  const saraAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-sara');
  const saraProfile = {
    id: userId,
    firstName: 'Sara',
    lastName: 'Caregiver',
    email: 'sara.caregiver@example.com',
    avatar: saraAvatar?.id || 'avatar-sara',
    role: 'Caregiver',
    hasBeenSeeded: true,
  };
  batch.set(userDocRef, saraProfile);


  // 2. Create George (Patient) profile and add him to Sara's caregivers subcollection
  const georgeId = 'george-patient-profile'; // Predictable ID
  const georgeDocRef = doc(firestore, 'users', georgeId);
  const georgeAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-george');
  const georgeProfile = {
    id: georgeId,
    firstName: 'George',
    lastName: 'Patient',
    email: 'george.patient@example.com',
    avatar: georgeAvatar?.id || 'avatar-george',
    role: 'Patient',
  };
  // Note: We don't set this user's profile directly, as they aren't the logged-in user.
  // Instead, we add a reference to them in the caregiver's list.
  const caregiverRefForGeorge = doc(firestore, 'users', userId, 'caregivers', georgeId);
  batch.set(caregiverRefForGeorge, georgeProfile);
  
  // 3. Add sample data to George's subcollections with deterministic IDs
  initialAppointments.forEach((apt) => {
    const aptId = `apt-${apt.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    batch.set(doc(georgeDocRef, 'appointments', aptId), { ...apt, id: aptId, profileId: georgeId });
    batch.set(doc(firestore, 'users', userId, 'profiles', georgeId, 'appointments', aptId), { ...apt, id: aptId, profileId: georgeId });
  });

  initialMedications.forEach((med) => {
    const medId = `med-${med.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    batch.set(doc(georgeDocRef, 'medications', medId), { ...med, id: medId, profileId: georgeId });
    batch.set(doc(firestore, 'users', userId, 'profiles', georgeId, 'medications', medId), { ...med, id: medId, profileId: georgeId });
  });

  initialVitals.forEach((vital) => {
    const vitalId = `vital-${vital.date}`;
    batch.set(doc(georgeDocRef, 'vitals', vitalId), { ...vital, id: vitalId, profileId: georgeId });
    batch.set(doc(firestore, 'users', userId, 'profiles', georgeId, 'vitals', vitalId), { ...vital, id: vitalId, profileId: georgeId });
  });

  await batch.commit();
}


import { VoiceProvider } from '@/contexts/voice-context';
import { FloatingVoiceAssistant } from '@/components/voice/floating-voice-assistant';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  useEffect(() => {
      if (user && firestore) {
          seedInitialData(user.uid, firestore).finally(() => {
              setIsSeeding(false);
          });
      }
  }, [user, firestore]);

  if (isUserLoading || !user || isSeeding) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <FamilyProvider>
      <VoiceProvider>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <AppSidebar />
          <div className="flex flex-col sm:gap-6 sm:py-6 sm:pl-20 sm:pr-8 w-full min-h-screen">
            <Header />
            <main className="flex-1 px-4 sm:px-6 w-full">
              {children}
            </main>
          </div>
        </div>
        <FloatingVoiceAssistant />
      </VoiceProvider>
    </FamilyProvider>
  );
}
