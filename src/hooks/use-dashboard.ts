'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { useAuthContext } from '@/contexts/auth-context';
import {
  DashboardData,
  aggregateDashboardData,
} from '@/lib/dashboard/dashboard-aggregation-service';
import {
  createDashboardSubscription,
  SubscriptionManager,
} from '@/lib/dashboard/dashboard-realtime-service';
import { getUserProfiles } from '@/firebase/firestore/users';

interface UseDashboardReturn {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refreshDashboard: () => Promise<void>;
}

/**
 * Hook for accessing and managing dashboard data with real-time updates
 */
export function useDashboard(): UseDashboardReturn {
  const firestore = useFirestore();
  const { user } = useAuthContext();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch and aggregate dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setDashboardData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await aggregateDashboardData(firestore, user.uid);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user]);

  /**
   * Refresh dashboard data manually
   */
  const refreshDashboard = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Set up real-time subscriptions
   */
  useEffect(() => {
    if (!user) {
      setDashboardData(null);
      setIsLoading(false);
      return;
    }

    let subscription: SubscriptionManager | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        // Initial fetch
        await fetchDashboardData();

        // Get profile IDs for subscriptions
        const profiles = await getUserProfiles(firestore, user.uid);
        const profileIds = profiles.map(p => p.id);

        if (!isMounted) return;

        // Set up real-time subscriptions
        subscription = createDashboardSubscription(
          firestore,
          user.uid,
          profileIds,
          () => {
            // Refresh dashboard when any data changes
            if (isMounted) {
              fetchDashboardData();
            }
          }
        );
      } catch (err) {
        console.error('Error setting up dashboard subscription:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to set up dashboard'));
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribeAll();
      }
    };
  }, [user, firestore, fetchDashboardData]);

  return {
    dashboardData,
    isLoading,
    error,
    refreshDashboard,
  };
}
