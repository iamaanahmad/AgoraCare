/**
 * Calendar Sync Types
 * Type definitions for calendar synchronization
 */

export type CalendarProvider = 'google' | 'outlook';

export interface CalendarSync {
  id?: string;
  userId: string;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  lastSyncAt: Date;
  syncEnabled: boolean;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  provider: CalendarProvider;
  externalId: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  appointmentId?: string; // Link to AgoraCare appointment
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface CalendarSyncStatus {
  provider: CalendarProvider;
  connected: boolean;
  lastSync?: Date;
  syncEnabled: boolean;
  error?: string;
}

export interface CalendarConflict {
  appointmentId: string;
  externalEventId: string;
  type: 'time_mismatch' | 'deleted_external' | 'deleted_internal';
  localData: any;
  externalData: any;
}
