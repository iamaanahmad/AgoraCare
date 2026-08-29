/**
 * OAuth Configuration for Calendar Providers
 */

export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
};

export const OUTLOOK_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID || '',
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_OUTLOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  scopes: [
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'offline_access',
  ],
};

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `${GOOGLE_OAUTH_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Generate Outlook OAuth authorization URL
 */
export function getOutlookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: OUTLOOK_OAUTH_CONFIG.clientId,
    redirect_uri: OUTLOOK_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: OUTLOOK_OAUTH_CONFIG.scopes.join(' '),
    state,
  });

  return `${OUTLOOK_OAUTH_CONFIG.authUrl}?${params.toString()}`;
}
