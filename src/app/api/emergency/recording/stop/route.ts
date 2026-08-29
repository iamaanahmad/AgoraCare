import { NextRequest, NextResponse } from 'next/server';

/**
 * Stop emergency call recording
 * This would integrate with Agora Cloud Recording API
 */
export async function POST(request: NextRequest) {
  try {
    const { recordingId } = await request.json();

    // TODO: Integrate with Agora Cloud Recording API
    // For now, return a mock response
    console.log('Stopping recording:', recordingId);

    // In production, you would:
    // 1. Stop the recording using the recording ID
    // 2. Get the recording file URL
    // 3. Store the recording metadata in Firestore

    return NextResponse.json({
      success: true,
      recordingUrl: `https://recordings.example.com/${recordingId}.mp3`,
      message: 'Recording stopped',
    });
  } catch (error) {
    console.error('Error stopping recording:', error);
    return NextResponse.json(
      { error: 'Failed to stop recording' },
      { status: 500 }
    );
  }
}
