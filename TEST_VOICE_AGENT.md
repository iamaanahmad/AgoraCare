# Testing Voice Agent - Step by Step

## Changes Made:

### 1. **Fixed Gemini Model** ✅
   - Changed from `gemini-2.0-flash-exp` (404 error) to `gemini-1.5-flash` (stable)
   - Updated both agent service AND text chat genkit.ts

### 2. **Fixed Agent Listening Configuration** ✅
   - Removed `remoteUids` parameter entirely
   - Agent now listens to **ALL users in channel** by default
   - This is the recommended configuration from official Agora docs

### 3. **Reduced Token Output** ✅
   - Changed from 1024 to 512 tokens for faster responses
   - Faster responses = less latency

## How the System Works:

```
User Flow:
1. User clicks mic icon → Opens voice chat
2. Frontend calls /api/agora/agent/start → Starts agent on backend
3. Agent joins RTC channel with UID 9999
4. User joins same RTC channel with random UID
5. User publishes microphone → Audio goes to RTC
6. Agent AUTOMATICALLY listens to all audio in channel
7. Agent's STT transcribes → LLM processes → TTS speaks
8. Agent publishes audio back to RTC
9. User hears response through RTC
```

## Test Steps:

1. **Open browser at**: http://localhost:9002
2. **Click floating microphone icon** (bottom right)
3. **Allow microphone access** when prompted
4. **Wait for greeting**: "Hello, I am Aria..."
5. **Speak clearly**: "What medications do I need to take today?"
6. **Wait 2-3 seconds** for agent to process
7. **Listen for response** about Lisinopril, Metformin, etc.

## Expected Logs:

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

## Troubleshooting:

### Agent greets but doesn't respond:
- **Most likely**: Microphone not publishing to RTC
- Check browser console for audio track errors
- Check server logs for STT processing
- Try speaking LOUDER and CLEARER

### No greeting at all:
- Agent didn't start properly
- Check server logs for errors
- Check Gemini API key is valid

### 404 Gemini error:
- Model not available
- Should be fixed now with `gemini-1.5-flash`

## Key Files Modified:

1. `src/lib/agora/convo-ai-service.ts`
   - Changed Gemini model to `gemini-1.5-flash`
   - Removed `remoteUids` restriction
   - Reduced token output to 512
   - Added better logging

2. `src/ai/genkit.ts`
   - Changed to `googleai/gemini-1.5-flash`

## Next Steps if Still Not Working:

1. Check if agent is actually receiving audio:
   - Add RTM transcripts to see what agent hears
   - Check if user's microphone is actually publishing

2. Try even simpler test:
   - Remove language parameter
   - Use default English only
   - Test with simple "Hello" message

3. Check Agora console:
   - Verify Conversational AI is enabled
   - Check if sessions are being created
   - Review any error logs

## Technical Notes:

- Agent uses **Agora-managed Deepgram** (no API key needed)
- Agent uses **Agora-managed MiniMax TTS** (no API key needed)
- Agent uses **your Google Gemini API key** for LLM
- Agent listens to **ALL users by default** (best practice)
- Agent idle timeout: **5 minutes**
- Agent session expires: **2 hours**
