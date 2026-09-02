import { NextRequest, NextResponse } from 'next/server';
import { startAgoraConversationalAgent } from '@/lib/agora/convo-ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      channelName,
      agentUid = 9999,
      userUid,
      language = 'en-IN',
      patientContext,
    } = body;

    if (!channelName) {
      return NextResponse.json(
        { error: 'channelName is required' },
        { status: 400 }
      );
    }

    const session = await startAgoraConversationalAgent({
      channelName,
      agentUid: typeof agentUid === 'number' ? agentUid : parseInt(agentUid, 10) || 9999,
      userUid,
      language,
      patientContext,
    });

    return NextResponse.json({
      success: true,
      session,
      message: 'Agora Conversational AI Agent initialized and connected to channel',
    });
  } catch (error: any) {
    console.error('Error starting Agora Conversational AI Agent:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to start Agora Conversational AI Agent',
      },
      { status: 500 }
    );
  }
}
