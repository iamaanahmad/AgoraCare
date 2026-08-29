'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface SessionConfig {
  redirectTo?: string;
  redirectIfFound?: string;
  requireAuth?: boolean;
}

/**
 * Hook for managing user session and authentication redirects
 */
export function useSession(config: SessionConfig = {}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  const {
    redirectTo = '/login',
    redirectIfFound,
    requireAuth = false,
  } = config;

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    // User is not authenticated but auth is required
    if (!user && requireAuth) {
      const returnUrl = pathname !== redirectTo ? `?returnUrl=${encodeURIComponent(pathname)}` : '';
      router.push(`${redirectTo}${returnUrl}`);
      return;
    }

    // User is authenticated but should be redirected (e.g., already logged in visiting login page)
    if (user && redirectIfFound) {
      router.push(redirectIfFound);
      return;
    }

    setIsReady(true);
  }, [user, isUserLoading, requireAuth, redirectTo, redirectIfFound, pathname, router]);

  return {
    user,
    isLoading: isUserLoading || !isReady,
    isAuthenticated: !!user,
    isReady,
  };
}

/**
 * Hook for protecting routes that require authentication
 */
export function useRequireAuth(redirectTo: string = '/login') {
  return useSession({ requireAuth: true, redirectTo });
}

/**
 * Hook for redirecting authenticated users (e.g., from login page)
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  return useSession({ redirectIfFound: redirectTo });
}

/**
 * Hook for managing session persistence
 */
export function useSessionPersistence() {
  const { user } = useUser();
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Update last activity on user interaction
  const updateActivity = useCallback(() => {
    setLastActivity(new Date());
  }, []);

  useEffect(() => {
    if (!user) return;

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [user, updateActivity]);

  return {
    lastActivity,
    isActive: user !== null,
  };
}

/**
 * Hook for checking if user has completed onboarding
 */
export function useOnboardingStatus() {
  const { user, isUserLoading } = useUser();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      setIsChecking(false);
      setHasCompletedOnboarding(false);
      return;
    }

    // Check if user has completed onboarding
    // This could check for profile completion, emergency contacts, etc.
    const checkOnboarding = async () => {
      try {
        // For now, we'll consider onboarding complete if user has displayName
        // In a full implementation, this would check Firestore for profile data
        const completed = !!(user.displayName || user.email);
        setHasCompletedOnboarding(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasCompletedOnboarding(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, isUserLoading]);

  return {
    hasCompletedOnboarding,
    isChecking,
    needsOnboarding: !hasCompletedOnboarding && !isChecking,
  };
}
