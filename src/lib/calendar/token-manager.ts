/**
 * Token Management for Calendar OAuth
 */

import { GOOGLE_OAUTH_CONFIG, OUTLOOK_OAUTH_CONFIG } from './oauth-config';
import { OAuthTokenResponse, CalendarProvider } from './types';

/**
 * Exchange authorization code for access token (Google)
 */
export async function exchangeGoogleCode(code: string): Promise<OAuthTokenResponse> {
  const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Google code: ${error}`);
  }

  return response.json();
}

/**
 * Exchange authorization code for access token (Outlook)
 */
export async function exchangeOutlookCode(code: string): Promise<OAuthTokenResponse> {
  const response = await fetch(OUTLOOK_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: OUTLOOK_OAUTH_CONFIG.clientId,
      client_secret: OUTLOOK_OAUTH_CONFIG.clientSecret,
      redirect_uri: OUTLOOK_OAUTH_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Outlook code: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token (Google)
 */
export async function refreshGoogleToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Google token: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token (Outlook)
 */
export async function refreshOutlookToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const response = await fetch(OUTLOOK_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: OUTLOOK_OAUTH_CONFIG.clientId,
      client_secret: OUTLOOK_OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Outlook token: ${error}`);
  }

  return response.json();
}

/**
 * Refresh token if needed
 */
export async function refreshTokenIfNeeded(
  provider: CalendarProvider,
  refreshToken: string
): Promise<OAuthTokenResponse> {
  if (provider === 'google') {
    return refreshGoogleToken(refreshToken);
  } else {
    return refreshOutlookToken(refreshToken);
  }
}
