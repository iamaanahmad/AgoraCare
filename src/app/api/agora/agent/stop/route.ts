import { NextRequest, NextResponse } from 'next/server';
import { stopAgoraConversationalAgent } from '@/lib/agora/convo-ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, channelName } = body;

    if (!channelName) {
      return NextResponse.json(
        { error: 'channelName is required' },
        { status: 400 }
      );
    }

    const result = await stopAgoraConversationalAgent(agentId || '', channelName);

    return NextResponse.json({
      success: true,
      result,
      message: 'Agora Conversational AI Agent session terminated',
    });
  } catch (error: any) {
    console.error('Error stopping Agora Conversational AI Agent:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to stop Agora Conversational AI Agent',
      },
      { status: 500 }
    );
  }
}
