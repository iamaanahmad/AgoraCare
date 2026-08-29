'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
  sendPasswordResetEmail,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<User>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading: isLoading, userError: error } = useUser();

  /**
   * Sign in with Google OAuth provider
   */
  const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    const result = await signInWithPopup(auth, provider);
    
    // Create or update user profile in Firestore
    await ensureUserProfile(result.user);
    
    return result.user;
  };

  /**
   * Sign in with email and password
   */
  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = async (
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    
    // Create user profile in Firestore
    await ensureUserProfile(result.user);
    
    return result.user;
  };

  /**
   * Initiate phone authentication
   * Returns a ConfirmationResult that can be used to verify the SMS code
   */
  const signInWithPhone = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  };

  /**
   * Verify phone authentication code
   */
  const verifyPhoneCode = async (
    confirmationResult: ConfirmationResult,
    code: string
  ): Promise<User> => {
    const result = await confirmationResult.confirm(code);
    
    // Create user profile in Firestore
    await ensureUserProfile(result.user);
    
    return result.user;
  };

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  /**
   * Update user profile information
   */
  const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    const updates: { displayName?: string; photoURL?: string } = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;

    await updateProfile(user, updates);
    
    // Update Firestore profile as well
    await ensureUserProfile(user);
  };

  /**
   * Helper function to ensure user profile exists in Firestore
   */
  const ensureUserProfile = async (user: User): Promise<void> => {
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        photoURL: user.photoURL || '',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update existing profile with latest auth info
      await setDoc(userRef, {
        email: user.email || userDoc.data().email,
        displayName: user.displayName || userDoc.data().displayName,
        phoneNumber: user.phoneNumber || userDoc.data().phoneNumber,
        photoURL: user.photoURL || userDoc.data().photoURL,
        updatedAt: new Date(),
      }, { merge: true });
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    verifyPhoneCode,
    signOut,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
