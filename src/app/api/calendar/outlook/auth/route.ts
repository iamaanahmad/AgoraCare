/**
 * Outlook Calendar OAuth Initiation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOutlookAuthUrl } from '@/lib/calendar/oauth-config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId,
        timestamp: Date.now(),
      })
    ).toString('base64');

    const authUrl = getOutlookAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Outlook OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Outlook OAuth' },
      { status: 500 }
    );
  }
}
