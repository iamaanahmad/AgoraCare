'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { useAuth } from '@/firebase';

/**
 * Hook for managing authentication state and operations
 */
export function useAuthentication() {
  const auth = useAuth();
  const authContext = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Sign in with Google
   */
  const handleGoogleSignIn = useCallback(async () => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      await authContext.signInWithGoogle();
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [authContext]);

  /**
   * Sign in with email and password
   */
  const handleEmailSignIn = useCallback(async (email: string, password: string) => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      await authContext.signInWithEmail(email, password);
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code);
      setAuthError(message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [authContext]);

  /**
   * Sign up with email and password
   */
  const handleEmailSignUp = useCallback(async (
    email: string, 
    password: string, 
    displayName?: string
  ) => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      await authContext.signUpWithEmail(email, password, displayName);
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code);
      setAuthError(message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [authContext]);

  /**
   * Initiate phone authentication
   */
  const handlePhoneSignIn = useCallback(async (
    phoneNumber: string,
    recaptchaContainerId: string
  ): Promise<ConfirmationResult> => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
      
      const confirmationResult = await authContext.signInWithPhone(phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code);
      setAuthError(message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [auth, authContext]);

  /**
   * Verify phone code
   */
  const handleVerifyPhoneCode = useCallback(async (
    confirmationResult: ConfirmationResult,
    code: string
  ) => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      await authContext.verifyPhoneCode(confirmationResult, code);
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code);
      setAuthError(message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [authContext]);

  /**
   * Sign out
   */
  const handleSignOut = useCallback(async () => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      await authContext.signOut();
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [authContext]);

  /**
   * Reset password
   */
  const handleResetPassword = useCallback(async (email: string) => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      await authContext.resetPassword(email);
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code);
      setAuthError(message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [authContext]);

  return {
    user: authContext.user,
    isLoading: authContext.isLoading,
    isProcessing,
    error: authError,
    signInWithGoogle: handleGoogleSignIn,
    signInWithEmail: handleEmailSignIn,
    signUpWithEmail: handleEmailSignUp,
    signInWithPhone: handlePhoneSignIn,
    verifyPhoneCode: handleVerifyPhoneCode,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  };
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code.';
    case 'auth/code-expired':
      return 'Verification code has expired.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Only one popup request is allowed at a time.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred during authentication.';
  }
}
