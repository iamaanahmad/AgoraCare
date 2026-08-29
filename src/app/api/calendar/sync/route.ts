/**
 * Calendar Sync API
 * Handles manual sync triggers and periodic synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/firebase';
import { getAllCalendarSyncs } from '@/firebase/firestore/calendar-sync';
import { getAppointmentsByDateRange } from '@/firebase/firestore/appointments';
import { syncAppointmentToCalendars, fetchExternalCalendarEvents } from '@/lib/calendar/calendar-sync-service';

/**
 * POST /api/calendar/sync
 * Manually trigger calendar synchronization
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, profileId } = await request.json();

    if (!userId || !profileId) {
      return NextResponse.json(
        { error: 'User ID and Profile ID are required' },
        { status: 400 }
      );
    }

    const firestore = getFirestore();

    // Get all calendar syncs for the user
    const syncs = await getAllCalendarSyncs(firestore, userId);

    if (syncs.length === 0) {
      return NextResponse.json(
        { message: 'No calendar syncs configured' },
        { status: 200 }
      );
    }

    // Sync appointments from the last 30 days and next 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const appointments = await getAppointmentsByDateRange(
      firestore,
      userId,
      profileId,
      startDate,
      endDate
    );

    // Sync each appointment to connected calendars
    const syncResults = [];
    for (const appointment of appointments) {
      if (appointment.status === 'scheduled') {
        try {
          await syncAppointmentToCalendars(firestore, userId, appointment);
          syncResults.push({ appointmentId: appointment.id, status: 'synced' });
        } catch (error) {
          console.error(`Error syncing appointment ${appointment.id}:`, error);
          syncResults.push({ 
            appointmentId: appointment.id, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Sync completed',
      synced: syncResults.filter(r => r.status === 'synced').length,
      errors: syncResults.filter(r => r.status === 'error').length,
      results: syncResults,
    });
  } catch (error) {
    console.error('Error in calendar sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendars' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/sync
 * Fetch external calendar events
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const provider = searchParams.get('provider') as 'google' | 'outlook' | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const firestore = getFirestore();

    // Fetch events from the last 30 days and next 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    let allEvents = [];

    if (provider) {
      // Fetch from specific provider
      const events = await fetchExternalCalendarEvents(
        firestore,
        userId,
        provider,
        startDate,
        endDate
      );
      allEvents.push(...events);
    } else {
      // Fetch from all connected providers
      const syncs = await getAllCalendarSyncs(firestore, userId);
      
      for (const sync of syncs) {
        if (sync.syncEnabled) {
          try {
            const events = await fetchExternalCalendarEvents(
              firestore,
              userId,
              sync.provider,
              startDate,
              endDate
            );
            allEvents.push(...events);
          } catch (error) {
            console.error(`Error fetching from ${sync.provider}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      events: allEvents,
      count: allEvents.length,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
