/**
 * Agora Token Generation API Route
 * Generates RTC tokens for secure channel access
 */

import { NextRequest, NextResponse } from 'next/server';

function generateAgoraToken({
  channelName,
  uid,
  role = 'publisher',
  expirationTimeInSeconds = 3600,
}: {
  channelName: string;
  uid?: string | number;
  role?: string;
  expirationTimeInSeconds?: number;
}) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId) {
    throw new Error('Agora App ID not configured');
  }

  if (!appCertificate || appCertificate === 'your_agora_certificate') {
    console.warn('No Agora certificate configured - using empty token');
    return {
      token: '',
      appId,
      channel: channelName,
      uid: uid || 0,
    };
  }

  const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  let token = '';
  let finalUid: string | number = 0;

  if (typeof uid === 'number' || (typeof uid === 'string' && /^\d+$/.test(uid))) {
    finalUid = typeof uid === 'number' ? uid : parseInt(uid, 10);
    token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      finalUid,
      rtcRole,
      privilegeExpiredTs
    );
  } else if (typeof uid === 'string' && uid.trim().length > 0) {
    finalUid = uid.trim();
    token = RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channelName,
      finalUid,
      rtcRole,
      privilegeExpiredTs
    );
  } else {
    finalUid = Math.floor(Math.random() * 900000) + 100000;
    token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      finalUid,
      rtcRole,
      privilegeExpiredTs
    );
  }

  return {
    token,
    appId,
    channel: channelName,
    uid: finalUid,
    expiresAt: privilegeExpiredTs,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channelName = searchParams.get('channelName');
    const uid = searchParams.get('uid') || undefined;

    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    const result = generateAgoraToken({ channelName, uid });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating Agora token (GET):', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, uid, role, expirationTimeInSeconds } = body;

    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    const result = generateAgoraToken({ channelName, uid, role, expirationTimeInSeconds });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating Agora token (POST):', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}
