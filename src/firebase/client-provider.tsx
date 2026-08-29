'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Messaging } from 'firebase/messaging';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, initializeMessaging } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  const [messaging, setMessaging] = useState<Messaging | null>(null);

  useEffect(() => {
    // Initialize messaging asynchronously
    initializeMessaging(firebaseServices.firebaseApp).then(setMessaging);
  }, [firebaseServices.firebaseApp]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
      messaging={messaging}
    >
      {children}
    </FirebaseProvider>
  );
}