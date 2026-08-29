/**
 * Outlook Calendar API Integration
 */

import { CalendarEvent } from './types';

const OUTLOOK_GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

interface OutlookCalendarEvent {
  id?: string;
  subject: string;
  body?: {
    contentType: string;
    content: string;
  };
  location?: {
    displayName: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: { address: string };
    type: string;
  }>;
}

/**
 * Create event in Outlook Calendar
 */
export async function createOutlookCalendarEvent(
  accessToken: string,
  eventData: Omit<CalendarEvent, 'id' | 'provider' | 'externalId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const outlookEvent: OutlookCalendarEvent = {
    subject: eventData.summary,
    body: eventData.description ? {
      contentType: 'text',
      content: eventData.description,
    } : undefined,
    location: eventData.location ? {
      displayName: eventData.location,
    } : undefined,
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
    outlookEvent.attendees = eventData.attendees.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    }));
  }

  const response = await fetch(
    `${OUTLOOK_GRAPH_API_BASE}/me/calendar/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outlookEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Outlook Calendar event: ${error}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Update event in Outlook Calendar
 */
export async function updateOutlookCalendarEvent(
  accessToken: string,
  eventId: string,
  eventData: Omit<CalendarEvent, 'id' | 'provider' | 'externalId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const outlookEvent: OutlookCalendarEvent = {
    subject: eventData.summary,
    body: eventData.description ? {
      contentType: 'text',
      content: eventData.description,
    } : undefined,
    location: eventData.location ? {
      displayName: eventData.location,
    } : undefined,
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
    outlookEvent.attendees = eventData.attendees.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    }));
  }

  const response = await fetch(
    `${OUTLOOK_GRAPH_API_BASE}/me/calendar/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outlookEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Outlook Calendar event: ${error}`);
  }
}

/**
 * Delete event from Outlook Calendar
 */
export async function deleteOutlookCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${OUTLOOK_GRAPH_API_BASE}/me/calendar/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete Outlook Calendar event: ${error}`);
  }
}

/**
 * Get events from Outlook Calendar
 */
export async function getOutlookCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    $orderby: 'start/dateTime',
  });

  const response = await fetch(
    `${OUTLOOK_GRAPH_API_BASE}/me/calendar/calendarView?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'outlook.timezone="' + Intl.DateTimeFormat().resolvedOptions().timeZone + '"',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Outlook Calendar events: ${error}`);
  }

  const result = await response.json();
  
  return result.value.map((item: any) => ({
    id: item.id,
    provider: 'outlook' as const,
    externalId: item.id,
    summary: item.subject || 'Untitled Event',
    description: item.body?.content,
    location: item.location?.displayName,
    startTime: new Date(item.start.dateTime),
    endTime: new Date(item.end.dateTime),
    attendees: item.attendees?.map((a: any) => a.emailAddress.address) || [],
    createdAt: new Date(item.createdDateTime),
    updatedAt: new Date(item.lastModifiedDateTime),
  }));
}
