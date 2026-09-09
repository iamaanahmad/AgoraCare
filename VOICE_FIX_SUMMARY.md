# Voice Agent Fix Summary

## Problem:
Agent greeted user but **never responded** when user spoke. No STT/LLM/TTS processing after greeting.

## Root Causes Identified:

### 1. **Wrong Gemini Model** ❌
- Was using: `gemini-2.0-flash-exp`
- Error: `404 Not Found - model not found for API version v1beta`
- Fix: Changed to `gemini-1.5-flash` (stable, working model)

### 2. **Agent Listening Configuration** ❌
- Was using: `remoteUids: [String(config.userUid)]` or `['*']`
- Problem: Agent configured to listen to SPECIFIC UID that might not match
- Fix: **Removed `remoteUids` parameter entirely**
- Default behavior: Agent listens to **ALL users in channel automatically**

### 3. **Response Latency** ⚠️
- Was using: `maxOutputTokens: 1024`
- Fix: Reduced to `512` for faster responses

## What I Learned from Old Working Version (commit e7ad4ea):

The OLD version used **browser Speech APIs**:
```javascript
// OLD FLOW (fake but working):
Browser Mic → Browser SpeechRecognition → Text → /api/ai/chat → Text → Browser SpeechSynthesis → Speaker

// It WORKED because it was SIMPLE:
- No complex RTC audio management
- No agent configuration issues
- Direct text-to-text pipeline with browser APIs for I/O
```

The NEW flow with **real Agora SDK**:
```javascript
// NEW FLOW (real Agora Conversational AI):
Browser Mic → RTC Audio → Agent STT → Agent LLM → Agent TTS → RTC Audio → Speaker

// It's MORE COMPLEX but PROPER:
- Real Agora Conversational AI architecture
- Agent runs on backend (scalable)
- Low-latency streaming audio
- Professional voice AI pipeline
```

## Key Changes Made:

### File: `src/lib/agora/convo-ai-service.ts`

**Before:**
```typescript
.withLlm(new Gemini({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
  model: 'gemini-2.0-flash-exp', // ❌ Doesn't exist
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 1024,
}))

const session = agent.createSession({
  channel: channelName,
  agentUid: agentUid.toString(),
  remoteUids: config.userUid ? [String(config.userUid)] : ['*'], // ❌ Too restrictive
  name: `AgoraCare-${channelName}`,
  expiresIn: ExpiresIn.hours(2),
  idleTimeout: 300,
});
```

**After:**
```typescript
.withLlm(new Gemini({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
  model: 'gemini-1.5-flash', // ✅ Stable working model
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 512, // ✅ Faster responses
}))

const session = agent.createSession({
  channel: channelName,
  agentUid: agentUid.toString(),
  // ✅ No remoteUids = listen to ALL users (default behavior)
  name: `AgoraCare-${channelName}`,
  expiresIn: ExpiresIn.hours(2),
  idleTimeout: 300,
});
```

### File: `src/ai/genkit.ts`

**Before:**
```typescript
model: 'googleai/gemini-1.5-flash-latest', // ❌ May not exist
```

**After:**
```typescript
model: 'googleai/gemini-1.5-flash', // ✅ Stable
```

## Official Agora Documentation Reference:

From: https://docs.agora.io/en/ai/build/custom-model-integration/build-server-client

Key insights:
1. **Agent listens automatically** to all audio in the channel
2. **No manual event listeners needed** on backend
3. **remoteUids is optional** - omit it to listen to everyone
4. **RTM is for transcripts only** - voice works without it
5. **Agent greeting happens automatically** on session.start()

## Architecture:

```
┌─────────────┐
│   Browser   │
│  (RTC SDK)  │
│             │
│  1. Publishes │
│     mic audio │
└──────┬──────┘
       │ RTC Channel
       │ "voice_session_XXX"
       │
       ▼
┌──────────────────────┐
│   Agora Agent SDK    │
│   (Backend Server)   │
│                      │
│  UID: 9999           │
│  Listens: ALL users  │
│                      │
│  STT: Deepgram ───┐  │
│  LLM: Gemini   ───┼──► Processing
│  TTS: MiniMax  ───┘  │
│                      │
│  2. Speaks response  │
└──────┬───────────────┘
       │ RTC Channel
       │
       ▼
┌─────────────┐
│   Browser   │
│  Hears      │
│  Response   │
└─────────────┘
```

## Testing Instructions:

1. Start server: `npm run dev`
2. Open: http://localhost:9002
3. Click floating mic icon
4. **Allow microphone** when prompted
5. Wait for greeting: "Hello, I am Aria..."
6. **Speak clearly**: "What medications should I take?"
7. **Wait 2-3 seconds** for response
8. Should hear response about medications

## Expected Server Logs:

```
[Agora Agents SDK] Agent configuration:
  - Channel: voice_session_XXXXX
  - Agent UID: 9999
  - User UID to listen: ALL
  - Language: en-IN
  - STT: Deepgram nova-2
  - LLM: Gemini 1.5 Flash
  - TTS: MiniMax 2.8-turbo
  - Voice: English_captivating_female1

[Agora Agents SDK] ✅ Agent started successfully: A44XXXXXXXXX
[Agora Agents SDK] 🎤 Agent is now LISTENING for user speech...

[Voice] User joined channel, microphone should be active
[Voice] ✅ Setup complete - agent will speak greeting shortly
```

## If Still Not Working:

1. **Check microphone permissions** in browser
2. **Check Google Gemini API key** is valid
3. **Check Agora Console**:
   - Conversational AI feature enabled?
   - Any error logs?
4. **Check browser console** for RTC errors
5. **Try speaking LOUDER** and more clearly
6. **Wait longer** (STT may take 2-3 seconds)

## Status:
✅ Gemini model fixed
✅ Agent listening configuration fixed  
✅ Response latency optimized
✅ Logging improved
🧪 Ready for testing

## Next Step:
**USER NEEDS TO TEST** and report back with:
- Does greeting work? ✅ (already confirmed)
- Does agent respond to speech? 🧪 (needs testing)
- What do server logs show? 🧪 (needs testing)
