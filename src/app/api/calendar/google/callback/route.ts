/**
 * Google Calendar OAuth Callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/lib/calendar/token-manager';
import { getFirestore } from '@/firebase';
import { saveCalendarSync } from '@/firebase/firestore/calendar-sync';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/profile?calendar_error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/profile?calendar_error=missing_params', request.url)
      );
    }

    // Decode and validate state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = stateData;

    if (!userId) {
      return NextResponse.redirect(
        new URL('/profile?calendar_error=invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeGoogleCode(code);

    // Save to Firestore
    const firestore = getFirestore();
    await saveCalendarSync(firestore, userId, 'google', {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || '',
      expiresIn: tokenResponse.expires_in,
    });

    // Redirect back to profile page with success
    return NextResponse.redirect(
      new URL('/profile?calendar_connected=google', request.url)
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/profile?calendar_error=callback_failed', request.url)
    );
  }
}
