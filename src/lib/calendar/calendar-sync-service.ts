/**
 * Calendar Sync Service
 * Manages bidirectional synchronization between AgoraCare and external calendars
 */

import { Firestore } from 'firebase/firestore';
import { Appointment } from '@/firebase/firestore/appointments';
import { CalendarSync, CalendarProvider, CalendarEvent } from './types';
import { getCalendarSync, updateLastSync, isTokenExpired, updateCalendarTokens } from '@/firebase/firestore/calendar-sync';
import { refreshTokenIfNeeded } from './token-manager';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent, getGoogleCalendarEvents } from './google-calendar-api';
import { createOutlookCalendarEvent, updateOutlookCalendarEvent, deleteOutlookCalendarEvent, getOutlookCalendarEvents } from './outlook-calendar-api';

/**
 * Convert AgoraCare appointment to calendar event format
 */
export function appointmentToCalendarEvent(appointment: Appointment): Omit<CalendarEvent, 'id' | 'provider' | 'externalId' | 'createdAt' | 'updatedAt'> {
  const endTime = new Date(appointment.dateTime);
  endTime.setMinutes(endTime.getMinutes() + appointment.duration);

  return {
    summary: `Appointment with ${appointment.doctorName}`,
    description: `Specialization: ${appointment.specialization}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`,
    location: appointment.location,
    startTime: appointment.dateTime,
    endTime,
    appointmentId: appointment.id,
  };
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getValidAccessToken(
  firestore: Firestore,
  userId: string,
  sync: CalendarSync
): Promise<string> {
  if (!isTokenExpired(sync)) {
    return sync.accessToken;
  }

  // Token is expired, refresh it
  const tokenResponse = await refreshTokenIfNeeded(sync.provider, sync.refreshToken);
  
  await updateCalendarTokens(
    firestore,
    userId,
    sync.provider,
    tokenResponse.access_token,
    tokenResponse.refresh_token || sync.refreshToken,
    tokenResponse.expires_in
  );

  return tokenResponse.access_token;
}

/**
 * Create calendar event in external calendar
 */
export async function createExternalCalendarEvent(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider,
  appointment: Appointment
): Promise<string> {
  const sync = await getCalendarSync(firestore, userId, provider);
  
  if (!sync || !sync.syncEnabled) {
    throw new Error(`Calendar sync not configured for ${provider}`);
  }

  const accessToken = await getValidAccessToken(firestore, userId, sync);
  const eventData = appointmentToCalendarEvent(appointment);

  let externalEventId: string;

  if (provider === 'google') {
    externalEventId = await createGoogleCalendarEvent(accessToken, eventData);
  } else {
    externalEventId = await createOutlookCalendarEvent(accessToken, eventData);
  }

  await updateLastSync(firestore, userId, provider);

  return externalEventId;
}

/**
 * Update calendar event in external calendar
 */
export async function updateExternalCalendarEvent(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider,
  externalEventId: string,
  appointment: Appointment
): Promise<void> {
  const sync = await getCalendarSync(firestore, userId, provider);
  
  if (!sync || !sync.syncEnabled) {
    throw new Error(`Calendar sync not configured for ${provider}`);
  }

  const accessToken = await getValidAccessToken(firestore, userId, sync);
  const eventData = appointmentToCalendarEvent(appointment);

  if (provider === 'google') {
    await updateGoogleCalendarEvent(accessToken, externalEventId, eventData);
  } else {
    await updateOutlookCalendarEvent(accessToken, externalEventId, eventData);
  }

  await updateLastSync(firestore, userId, provider);
}

/**
 * Delete calendar event from external calendar
 */
export async function deleteExternalCalendarEvent(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider,
  externalEventId: string
): Promise<void> {
  const sync = await getCalendarSync(firestore, userId, provider);
  
  if (!sync || !sync.syncEnabled) {
    return; // Silently skip if sync is not configured
  }

  const accessToken = await getValidAccessToken(firestore, userId, sync);

  if (provider === 'google') {
    await deleteGoogleCalendarEvent(accessToken, externalEventId);
  } else {
    await deleteOutlookCalendarEvent(accessToken, externalEventId);
  }

  await updateLastSync(firestore, userId, provider);
}

/**
 * Fetch events from external calendar
 */
export async function fetchExternalCalendarEvents(
  firestore: Firestore,
  userId: string,
  provider: CalendarProvider,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const sync = await getCalendarSync(firestore, userId, provider);
  
  if (!sync || !sync.syncEnabled) {
    return [];
  }

  const accessToken = await getValidAccessToken(firestore, userId, sync);

  let events: CalendarEvent[];

  if (provider === 'google') {
    events = await getGoogleCalendarEvents(accessToken, startDate, endDate);
  } else {
    events = await getOutlookCalendarEvents(accessToken, startDate, endDate);
  }

  await updateLastSync(firestore, userId, provider);

  return events;
}

/**
 * Sync appointment to all connected calendars
 */
export async function syncAppointmentToCalendars(
  firestore: Firestore,
  userId: string,
  appointment: Appointment
): Promise<void> {
  const providers: CalendarProvider[] = ['google', 'outlook'];

  for (const provider of providers) {
    try {
      const sync = await getCalendarSync(firestore, userId, provider);
      
      if (sync && sync.syncEnabled) {
        if (appointment.calendarProvider === provider && appointment.calendarEventId) {
          // Update existing event
          await updateExternalCalendarEvent(
            firestore,
            userId,
            provider,
            appointment.calendarEventId,
            appointment
          );
        } else if (!appointment.calendarEventId) {
          // Create new event
          const externalEventId = await createExternalCalendarEvent(
            firestore,
            userId,
            provider,
            appointment
          );
          
          // Update appointment with calendar info
          const { updateAppointment } = await import('@/firebase/firestore/appointments');
          await updateAppointment(firestore, userId, appointment.profileId, appointment.id, {
            calendarEventId: externalEventId,
            calendarProvider: provider,
          });
        }
      }
    } catch (error) {
      console.error(`Error syncing to ${provider}:`, error);
      // Continue with other providers
    }
  }
}
