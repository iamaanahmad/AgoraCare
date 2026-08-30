/**
 * Agora Token Generation API Route
 * Generates RTC tokens for secure channel access
 */

import { NextRequest, NextResponse } from 'next/server';

// Note: In production, you should use Agora's official token generation library
// npm install agora-access-token
// For now, this is a simplified version

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, uid, role = 'publisher', expirationTimeInSeconds = 3600 } = body;

    // Validate required fields
    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId) {
      return NextResponse.json(
        { error: 'Agora App ID not configured' },
        { status: 500 }
      );
    }

    // If no certificate is set, return empty token (for development only)
    if (!appCertificate || appCertificate === 'your_agora_certificate') {
      console.warn('No Agora certificate configured - using null token (development only)');
      return NextResponse.json({
        token: '',
        appId,
        channel: channelName,
        uid: uid || 0,
      });
    }

    const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Convert uid to integer as expected by RtcTokenBuilder
    const numericUid = uid ? parseInt(uid, 10) : 0;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      numericUid,
      role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );

    return NextResponse.json({
      token: token,
      appId,
      channel: channelName,
      uid: numericUid,
      expiresAt: privilegeExpiredTs,
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
