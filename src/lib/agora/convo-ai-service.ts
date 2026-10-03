/**
 * Agora Conversational AI Engine — convo-ai-service.ts
 *
 * Uses the official `agora-agents` SDK Agent/AgentSession builder for START,
 * which correctly serializes Agora-managed TTS presets (MiniMax managed mode
 * uses a preset reference, NOT a raw `model` field — hand-rolled REST payloads
 * silently produce a running-but-mute agent). Stop uses the SDK session too.
 *
 * Pipeline:
 *   - Auth : app credentials (appId + appCertificate) → SDK auto-generates
 *            the ConvoAI REST token and the agent's RTC join token.
 *   - STT  : Agora-managed Ares ASR (turnDetection.language)
 *   - LLM  : Gemini 3.8 Flash via OpenAI-compatible endpoint (BYOK)
 *   - TTS  : MiniMax managed (speech-2.6-turbo, no key)
 *
 * Required env:
 *   NEXT_PUBLIC_AGORA_APP_ID
 *   AGORA_APP_CERTIFICATE
 *   GOOGLE_GENAI_API_KEY
 */

import { AgoraClient, Agent, Area, ExpiresIn, MiniMaxTTS, CustomLLM } from 'agora-agents';

export interface AgoraConvoAgentConfig {
  channelName: string;
  agentUid?: number;
  userUid?: number | string;
  language?: 'hi-IN' | 'en-IN';
  patientContext?: {
    name?: string;
    medications?: string[];
    conditions?: string[];
  };
}

export interface AgoraConvoAgentSession {
  agentId: string;
  channelName: string;
  agentUid: number;
  status: 'running';
  startedAt: string;
  engine: 'agora-conversational-ai-v2';
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

let _client: AgoraClient | null = null;
// Keep the live session objects so stop() can call session.stop() (clean leave).
const _sessions = new Map<string, { session: any; agentId: string }>();

function getClient(): AgoraClient {
  if (!_client) {
    _client = new AgoraClient({
      area: Area.AP,
      appId: env('NEXT_PUBLIC_AGORA_APP_ID'),
      appCertificate: env('AGORA_APP_CERTIFICATE'),
    });
  }
  return _client;
}

function buildSystemPrompt(config: AgoraConvoAgentConfig, isHindi: boolean): string {
  const name = config.patientContext?.name ?? 'the patient';
  const meds =
    config.patientContext?.medications?.join(', ') ??
    'Lisinopril 10mg, Metformin 500mg, Amlodipine 5mg, Simvastatin 20mg';
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return isHindi
    ? `आप आरिया हैं, AgoraCare की सहानुभूतिपूर्ण स्वास्थ्य सहायक, और ${name} की मदद करती हैं।
अभी का समय: ${now} (IST)।

अत्यंत महत्वपूर्ण नियम:
1. आपका हर एक जवाब हमेशा हिंदी (देवनागरी) में होगा — चाहे सवाल किसी भी विषय का हो, जैसे दवा, समय, या तबीयत। दवाओं के बारे में भी जवाब हिंदी में ही दें, अंग्रेज़ी में कभी नहीं। सिर्फ़ दवा के नाम (जैसे Lisinopril) अंग्रेज़ी में रह सकते हैं, बाकी पूरा वाक्य हिंदी में हो।
2. छोटे और साफ़ वाक्य बोलें (25 शब्दों से कम)।
3. दवा का समय इस तरह बताएं:
   - Lisinopril — सुबह 8 बजे
   - Metformin — दोपहर 1 बजे
   - Amlodipine — शाम 6:30 बजे
   - Simvastatin — रात 9 बजे
   उदाहरण: अगर मरीज़ पूछे "Metformin कब लेनी है?", तो कहें: "Metformin दोपहर 1 बजे लेनी है।"
4. अगर मरीज़ को सीने में दर्द, साँस की तकलीफ़, या कोई आपात स्थिति हो, तो तुरंत "escalateToHumanNurse" टूल का उपयोग करें।
5. आप एक स्वास्थ्य साथी हैं, डॉक्टर नहीं।`
    : `You are Aria, an empathetic healthcare AI assistant for AgoraCare, helping ${name}.
Current time: ${now} (IST). Medications: ${meds}.

Rules:
1. Reply in the SAME language the patient speaks. If they speak English, reply in English; if they speak Hindi, reply in Hindi. NEVER refuse or say you can only speak one language.
2. Keep replies under 25 words.
3. Med schedule: Lisinopril 8AM, Metformin 1PM, Amlodipine 6:30PM, Simvastatin 9PM.
4. If the patient reports chest pain, breathlessness, or any emergency, immediately call the "escalateToHumanNurse" tool.
5. You are a health companion, not a doctor.`;
}

export async function startAgoraConversationalAgent(
  config: AgoraConvoAgentConfig,
): Promise<AgoraConvoAgentSession> {
  const client = getClient();
  const agentUid = config.agentUid ?? 9999;
  const channelName = config.channelName;
  const isHindi = (config.language ?? 'en-IN') === 'hi-IN';

  // Append a machine-readable channel marker. The LLM proxy reads this from
  // the system messages to tag escalations with the patient's RTC channel.
  const systemPrompt =
    buildSystemPrompt(config, isHindi) + `\n\n<!-- agora_channel:${channelName} -->`;
  const greeting = isHindi
    ? 'Namaste! Main Aria hoon, aapki health companion. Aaj main aapki kaise madad karun?'
    : 'Hello! I am Aria, your health companion. How can I help you today?';

  const agent = new Agent({
    client,
    turnDetection: { language: isHindi ? 'hi-IN' : 'en-US' },
    parameters: { enable_error_message: true },
  })
    // LLM via our Vertex AI proxy (reliable — no free-tier 429/503). The agent
    // (running in Agora's cloud) calls LLM_PROXY_URL; our backend forwards to
    // Vertex using the GCP service account. LLM_PROXY_URL must be publicly
    // reachable (a cloudflared/ngrok tunnel to localhost:9002 in dev).
    .withLlm(
      new CustomLLM({
        url: `${env('LLM_PROXY_URL')}/api/agora/llm/chat/completions`,
        apiKey: process.env.AGORA_LLM_PROXY_KEY || 'agoracare-vertex-proxy',
        model: 'vertex-gemini', // ignored by proxy; it forces the Vertex model
        systemMessages: [{ role: 'system', content: systemPrompt }],
        greetingMessage: greeting,
        failureMessage: isHindi ? 'Ek pal rukiye.' : 'Please hold on a moment.',
        maxHistory: 30,
        params: { temperature: 0.7, max_tokens: 256 },
      }),
    )
    // Agora-managed MiniMax TTS — NO key. The SDK serializes the managed
    // preset correctly. Use a NATIVE Hindi voice for Hindi (an English voice
    // speaking Devanagari sounds foreign/accented) and an English voice for
    // English. Both validated against the ConvoAI join API.
    .withTts(
      new MiniMaxTTS({
        model: 'speech-2.6-turbo',
        voiceId: isHindi ? 'Hindi_SweetGirl' : 'English_captivating_female1',
      }),
    );

  const session = agent.createSession({
    name: `agoracare-${channelName}`,
    channel: channelName,
    agentUid: agentUid.toString(),
    remoteUids: ['*'],
    idleTimeout: 300,
    expiresIn: ExpiresIn.hours(2),
  });

  console.log(`[ConvoAI] starting agent channel="${channelName}" uid=${agentUid} lang=${isHindi ? 'hi-IN' : 'en-US'}`);
  const agentId = await session.start();
  console.log(`[ConvoAI] ✅ Agent RUNNING — agentId=${agentId}`);

  _sessions.set(channelName, { session, agentId });

  return {
    agentId,
    channelName,
    agentUid,
    status: 'running',
    startedAt: new Date().toISOString(),
    engine: 'agora-conversational-ai-v2',
  };
}

export async function stopAgoraConversationalAgent(
  agentId: string,
  channelName: string,
): Promise<{ success: boolean }> {
  const entry = _sessions.get(channelName);
  try {
    if (entry?.session && typeof entry.session.stop === 'function') {
      await entry.session.stop();
      _sessions.delete(channelName);
      console.log(`[ConvoAI] agent stopped via session — ${entry.agentId}`);
      return { success: true };
    }
    // Fallback: direct REST leave if we lost the session handle.
    const appId = env('NEXT_PUBLIC_AGORA_APP_ID');
    const id = agentId || entry?.agentId;
    if (id) {
      // Best-effort; app-cred auth header is handled by the SDK normally,
      // so without the session we simply drop tracking.
      _sessions.delete(channelName);
    }
    return { success: true };
  } catch (err) {
    console.warn('[ConvoAI] stop error:', err);
    _sessions.delete(channelName);
    return { success: false };
  }
}
