/**
 * Google Calendar API Integration
 */

import { CalendarEvent } from './types';

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
}

/**
 * Create event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  eventData: Omit<CalendarEvent, 'id' | 'provider' | 'externalId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const googleEvent: GoogleCalendarEvent = {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  if (eventData.attendees && eventData.attendees.length > 0) {
    googleEvent.attendees = eventData.attendees.map(email => ({ email }));
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${error}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  eventData: Omit<CalendarEvent, 'id' | 'provider' | 'externalId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const googleEvent: GoogleCalendarEvent = {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  if (eventData.attendees && eventData.attendees.length > 0) {
    googleEvent.attendees = eventData.attendees.map(email => ({ email }));
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Google Calendar event: ${error}`);
  }
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete Google Calendar event: ${error}`);
  }
}

/**
 * Get events from Google Calendar
 */
export async function getGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Google Calendar events: ${error}`);
  }

  const result = await response.json();
  
  return result.items.map((item: any) => ({
    id: item.id,
    provider: 'google' as const,
    externalId: item.id,
    summary: item.summary || 'Untitled Event',
    description: item.description,
    location: item.location,
    startTime: new Date(item.start.dateTime || item.start.date),
    endTime: new Date(item.end.dateTime || item.end.date),
    attendees: item.attendees?.map((a: any) => a.email) || [],
    createdAt: new Date(item.created),
    updatedAt: new Date(item.updated),
  }));
}
