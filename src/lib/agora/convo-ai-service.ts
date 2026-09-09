/**
 * Agora Conversational AI Engine Integration Service
 * Uses the official Agora Agents SDK with typed builder pattern (.withStt, .withLlm, .withTts)
 * Manages Server-Side AI Agent lifecycle, real-time voice streaming,
 * LLM orchestration, TTS synthesis, and automated nurse escalation.
 */

import { AgoraClient, Agent, Area, ExpiresIn } from 'agora-agents';
import { Gemini, DeepgramSTT, MiniMaxTTS } from 'agora-agents';

export interface AgoraConvoAgentConfig {
  channelName: string;
  agentUid?: number;
  userUid?: number | string;
  language?: 'hi-IN' | 'en-IN';
  voiceName?: string;
  patientContext?: {
    name?: string;
    medications?: any[];
    conditions?: string[];
  };
}

export interface AgoraConvoAgentSession {
  agentId: string;
  channelName: string;
  agentUid: number;
  status: 'starting' | 'running' | 'stopped' | 'failed';
  startedAt: string;
  engine: 'agora-conversational-ai-v2';
  session?: any; // Holds the actual AgentSession instance
}

// Global client instance (reusable across sessions)
let agoraClient: AgoraClient | null = null;

// Session tracking (store active sessions by channel name)
const activeSessions = new Map<string, any>();

/**
 * Get or create the Agora Client
 */
function getAgoraClient(): AgoraClient {
  if (!agoraClient) {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('NEXT_PUBLIC_AGORA_APP_ID and AGORA_APP_CERTIFICATE are required');
    }

    agoraClient = new AgoraClient({
      area: Area.AP,
      appId,
      appCertificate,
    });

    console.log('[Agora Agents SDK] Client initialized with app credentials mode (Area: AP)');
  }

  return agoraClient;
}

/**
 * Start an Agora Conversational AI Agent using the official SDK
 */
export async function startAgoraConversationalAgent(
  config: AgoraConvoAgentConfig
): Promise<AgoraConvoAgentSession> {
  const client = getAgoraClient();
  const agentUid = config.agentUid || 9999;
  const channelName = config.channelName;
  const language = config.language || 'en-IN';

  console.log('[Agora Agents SDK] Agent configuration:');
  console.log('  - Channel:', channelName);
  console.log('  - Agent UID:', agentUid);
  console.log('  - Listening to: ALL users in channel ["*"]');
  console.log('  - Language:', language);
  console.log('  - STT: Deepgram nova-2');
  console.log('  - LLM: Gemini 1.5 Flash');
  console.log('  - TTS: MiniMax 2.8-turbo');
  console.log('  - Voice:', language === 'hi-IN' ? 'Hindi_Female_Saavni' : 'English_captivating_female1');
  
  // Build the system prompt
  const systemPrompt = `You are Aria, an empathetic female healthcare AI assistant for AgoraCare.
You assist patient George with medication schedules and symptoms in ${language === 'hi-IN' ? 'Hindi' : 'English/Hinglish'}.
The current system date and time is: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })}. 

Rules:
1. State scheduled medication times accurately (Lisinopril 10mg Morning 8AM, Metformin 500mg Lunch 1PM, Amlodipine 5mg Evening 6:30PM, Simvastatin 20mg Bedtime 9PM).
2. Use the current system time to contextually answer if a medication was missed or is upcoming.
3. If patient reports acute chest pain, shortness of breath, or emergency, invoke tool "escalateToHumanNurse".
4. Keep spoken replies under 25 words.`;

  const greetingMessage = language === 'hi-IN' 
    ? 'Namaste, main Aria hoon. Main aapki madad ke liye yahan hoon.'
    : 'Hello, I am Aria, your healthcare assistant. How can I help you today?';

  // Configure the agent using the builder pattern
  const agent = new Agent({ 
    client,
    instructions: systemPrompt,
    greeting: greetingMessage,
    maxHistory: 50,
  })
    .withStt(new DeepgramSTT({
      model: 'nova-2',
      language: language === 'hi-IN' ? 'hi' : 'en',
    }))
    .withLlm(new Gemini({
      apiKey: process.env.GOOGLE_GENAI_API_KEY!,
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 512,
    }))
    .withTts(new MiniMaxTTS({
      model: 'speech-2.8-turbo',
      voiceId: language === 'hi-IN' ? 'Hindi_Female_Saavni' : 'English_captivating_female1',
    }));

  // Create a session
  const session = agent.createSession({
    channel: channelName,
    agentUid: agentUid.toString(),
    remoteUids: ['*'],
    name: `AgoraCare-${channelName}`,
    expiresIn: ExpiresIn.hours(2),
    idleTimeout: 300,
  });

  // Start the agent
  try {
    console.log('[Agora Agents SDK] Starting agent session...');
    const agentId = await session.start();
    console.log('[Agora Agents SDK] ✅ Agent started successfully:', agentId);
    console.log('[Agora Agents SDK] Agent will join channel:', channelName, 'with UID:', agentUid);
    console.log('[Agora Agents SDK] Agent listening to: ALL users in channel (remoteUids: ["*"])');
    console.log('[Agora Agents SDK] Agent greeting configured:', greetingMessage);
    console.log('[Agora Agents SDK] Agent TTS voice:', language === 'hi-IN' ? 'Hindi_Female_Saavni' : 'English_captivating_female1');
    console.log('[Agora Agents SDK] 🎤 Agent is now LISTENING for user speech...');

    activeSessions.set(channelName, session);

    return {
      agentId,
      channelName,
      agentUid,
      status: 'running',
      startedAt: new Date().toISOString(),
      engine: 'agora-conversational-ai-v2',
      session,
    };
  } catch (error) {
    console.error('[Agora Agents SDK] ❌ Failed to start agent:', error);
    throw error;
  }
}

/**
 * Stop an Agora Conversational AI Agent session
 */
export async function stopAgoraConversationalAgent(
  agentId: string,
  channelName: string,
  session?: any
): Promise<{ success: boolean }> {
  try {
    const storedSession = activeSessions.get(channelName);
    const sessionToStop = session || storedSession;

    if (sessionToStop && typeof sessionToStop.stop === 'function') {
      await sessionToStop.stop();
      console.log('[Agora Agents SDK] Agent stopped via session.stop()');
    } else if (agentId) {
      const client = getAgoraClient();
      await client.agents.stop({
        appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        agentId,
      });
      console.log('[Agora Agents SDK] Agent stopped via direct API call');
    }

    activeSessions.delete(channelName);

    return { success: true };
  } catch (err) {
    console.warn('[Agora Agents SDK] Error stopping agent session:', err);
    return { success: false };
  }
}
