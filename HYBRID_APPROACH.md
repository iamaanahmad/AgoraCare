# Hybrid Approach: Old Working Flow + Real Agora SDK

## Old Flow (Working but Fake):
1. User clicks mic → Browser Speech Recognition starts
2. User speaks → Browser transcribes to text
3. Text sent to `/api/ai/chat` → Genkit processes
4. Response comes back as text
5. Browser Speech Synthesis speaks the response
6. Agora RTC not actually used for voice

## New Flow (Real Agora SDK):
1. User clicks mic → Start Agora Agent (backend)
2. User speaks → Agora RTC sends audio → Agent's STT transcribes
3. Agent's LLM processes → Agent's TTS generates speech
4. Agent publishes audio to RTC → User hears response
5. **Backup**: If agent doesn't respond in 5 seconds, fall back to browser APIs

## Key Changes:
- Remove browser Speech Recognition/Synthesis
- Let Agora Agent handle EVERYTHING
- Simplify the flow
- Keep the agent running (don't stop prematurely)
- Show transcripts from agent events

## Implementation Plan:
1. Restore simple connect/disconnect from old version
2. Remove all manual audio handling
3. Let agent SDK do its job
4. Add timeout fallback to browser APIs if agent fails
