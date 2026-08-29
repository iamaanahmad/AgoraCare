'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { getAllCalendarSyncs } from '@/firebase/firestore/calendar-sync';
import { CalendarSync, CalendarSyncStatus, CalendarEvent } from '@/lib/calendar/types';

export function useCalendarSync(userId: string | undefined) {
  const firestore = useFirestore();
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncs = useCallback(async () => {
    if (!firestore || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAllCalendarSyncs(firestore, userId);
      setSyncs(data);
    } catch (err) {
      console.error('Error fetching calendar syncs:', err);
      setError('Failed to load calendar syncs');
    } finally {
      setLoading(false);
    }
  }, [firestore, userId]);

  useEffect(() => {
    fetchSyncs();
  }, [fetchSyncs]);

  const triggerSync = async (profileId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, profileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync calendars');
      }

      const result = await response.json();
      await fetchSyncs();
      return result;
    } catch (err) {
      console.error('Error syncing calendars:', err);
      setError('Failed to sync calendars');
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  const fetchExternalEvents = async (): Promise<CalendarEvent[]> => {
    if (!userId) {
      return [];
    }

    try {
      const response = await fetch(`/api/calendar/sync?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch external events');
      }

      const result = await response.json();
      return result.events || [];
    } catch (err) {
      console.error('Error fetching external events:', err);
      return [];
    }
  };

  const getSyncStatus = (): CalendarSyncStatus[] => {
    return syncs.map(sync => ({
      provider: sync.provider,
      connected: true,
      lastSync: sync.lastSyncAt,
      syncEnabled: sync.syncEnabled,
    }));
  };

  const isConnected = (provider: 'google' | 'outlook'): boolean => {
    return syncs.some(sync => sync.provider === provider && sync.syncEnabled);
  };

  return {
    syncs,
    loading,
    syncing,
    error,
    triggerSync,
    fetchExternalEvents,
    getSyncStatus,
    isConnected,
    refresh: fetchSyncs,
  };
}
