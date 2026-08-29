'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { UserProfile } from '@/lib/types';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

interface FamilyContextType {
  selectedMember: UserProfile;
  setSelectedMember: (member: UserProfile) => void;
  members: UserProfile[];
  loading: boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // This now represents the list of people the current user is a caregiver FOR.
  const caregivingCollectionRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'caregivers') : null, [firestore, user]);
  const { data: caregivingFor, isLoading: areCaregivingForLoading } = useCollection<UserProfile>(caregivingCollectionRef);

  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);

  const mockGeorge: UserProfile = {
    id: 'george-patient-profile',
    firstName: 'George',
    lastName: 'Patient',
    email: 'george@example.com',
    role: 'Patient',
    avatar: 'avatar-george',
  };

  const actualUserProfile = isUserProfileLoading ? undefined : (userProfile || mockGeorge);
  const actualCaregivingFor = areCaregivingForLoading ? undefined : (caregivingFor || []);

  const allMembers = useMemo(() => {
    if (!actualUserProfile) return [];
    const combined = actualCaregivingFor.length > 0 ? [actualUserProfile, ...actualCaregivingFor] : [actualUserProfile];
    return combined.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
  }, [actualUserProfile, actualCaregivingFor]);

  useEffect(() => {
    if (allMembers.length > 0 && !selectedMember) {
        const george = allMembers.find(m => m.role === 'Patient');
        setSelectedMember(george || allMembers[0]);
    }
  }, [allMembers, selectedMember]);

  const loading = isUserProfileLoading || areCaregivingForLoading || !selectedMember || !actualUserProfile;

  const contextValue = useMemo(() => {
    if (loading || !selectedMember) {
        return { loading: true, members: [], selectedMember: null as any, setSelectedMember: () => {} };
    }
    return {
      selectedMember: selectedMember,
      setSelectedMember,
      members: allMembers,
      loading: false,
    }
  }, [selectedMember, allMembers, loading]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center">Loading authentication...</div>
  }

  if (!user) {
    return (
      <FamilyContext.Provider value={{ loading: false, members: [], selectedMember: null as any, setSelectedMember: () => {} }}>
        {children}
      </FamilyContext.Provider>
    );
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading family data...</div>
  }

  return (
    <FamilyContext.Provider value={contextValue}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
