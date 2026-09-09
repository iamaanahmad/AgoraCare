# 🎙️ Agora Conversational AI Engine Integration Guide

> **Project:** AgoraCare — AI-Powered Remote Healthcare & Real-Time Emergency Voice Escalation  
> **Engine:** Agora Conversational AI Engine with **Official Agora Agents SDK**  
> **SDK:** `agora-agents` npm package with `.withStt()`, `.withLlm()`, `.withTts()` builder pattern  
> **Domain:** Real-Time Conversational AI & Telehealth Escalation  

---

## 🏗️ Architecture & How It Works

AgoraCare implements the **official Agora Agents SDK** (`agora-agents` npm package) with the typed builder pattern. When a patient initiates a voice session, a server-side AI Agent (**Aria**) is provisioned using `.withStt()`, `.withLlm()`, `.withTts()` methods into the Agora RTC channel, orchestrating real-time audio input, speech recognition, LLM reasoning, voice synthesis, and clinical tool execution:

```mermaid
flowchart TD
    subgraph Client ["Client Device (Patient App)"]
        UI[🎤 Floating Voice Assistant]
        RTC_Client[Agora RTC Web Client]
    end

    subgraph Server ["AgoraCare Cloud Backend"]
        StartAgent["POST /api/agora/agent/start"]
        ConvoService["Agora Convo AI Service (convo-ai-service.ts)"]
        ToolWebhook["POST /api/agora/agent/tool"]
    end

    subgraph AgoraCloud ["Agora Conversational AI Cloud Gateway"]
        AgentEngine["Agora Convo AI Agent (Aria)"]
        VAD["Voice Activity Detection (VAD)"]
        ASR["ASR Engine (Hindi / English)"]
        LLM["LLM Engine (Gemini 2.5 Flash / Genkit)"]
        TTS["TTS Engine (hi-IN-SwaraNeural / en-IN-NeerjaNeural)"]
    end

    subgraph NurseDashboard ["Live Nurse Portal (/agent)"]
        NurseUI[🚨 Live Nurse Dashboard]
        Chime[🔔 Web Audio Emergency Chime]
    end

    UI -->|1. Connect Channel| RTC_Client
    RTC_Client -->|2. Join Channel| StartAgent
    StartAgent -->|3. Provision Agent| ConvoService
    ConvoService -->|4. HTTP Basic Auth REST API| AgentEngine
    AgentEngine -->|5. Join RTC Channel (UID 9999)| RTC_Client
    RTC_Client <-->|6. Real-Time 2-Way Audio Stream| AgentEngine

    AgentEngine --> VAD
    VAD --> ASR
    ASR --> LLM
    LLM --> TTS
    TTS --> AgentEngine

    LLM -->|7. Acute Distress Detected (Tool Call)| ToolWebhook
    ToolWebhook -->|8. Push Emergency Ticket| NurseDashboard
    NurseDashboard --> Chime
    NurseUI -->|9. Accept Call & Bridge Audio| RTC_Client
```

---

## 📂 Key Source Code Implementation Files

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Agora Agents SDK Service** | [`src/lib/agora/convo-ai-service.ts`](file:///c:/Projects/AgoraCare/src/lib/agora/convo-ai-service.ts) | Core service using official `agora-agents` SDK with `.withStt()`, `.withLlm()`, `.withTts()` builder pattern. Manages AgoraClient, Agent configuration, session lifecycle, and token generation. |
| **Agent Start Endpoint** | [`src/app/api/agora/agent/start/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/agent/start/route.ts) | Starts the Conversational AI Agent using the SDK's `agent.createSession()` and `session.start()` methods. |
| **Agent Stop Endpoint** | [`src/app/api/agora/agent/stop/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/agent/stop/route.ts) | Terminates the agent using `session.stop()` from the SDK. |
| **Agent Tool Calling Webhook** | [`src/app/api/agora/agent/tool/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/agent/tool/route.ts) | Handles tool execution callbacks (`escalateToHumanNurse`, `getMedicationSchedule`). |
| **Client Voice Coordinator** | [`src/contexts/voice-context.tsx`](file:///c:/Projects/AgoraCare/src/contexts/voice-context.tsx) | Synchronizes client RTC connection with the backend Conversational AI Agent session. |
| **Dynamic RTC Token Issuer** | [`src/app/api/agora/token/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/token/route.ts) | Issues dynamic cryptographic Agora RTC tokens for both user and agent UIDs. |

---

## 🔧 Agora Agents SDK Implementation

### Installation

```bash
npm install agora-agents
```

### Core SDK Components Used

```typescript
import {
  AgoraClient,   // Client for API authentication
  Agent,         // Agent builder with .withStt(), .withLlm(), .withTts()
  Area,          // Regional routing (Area.US, Area.EU, Area.AP, Area.CN)
  ExpiresIn,     // Token expiry helpers
  Gemini,        // Google Gemini LLM
  MicrosoftTTS,  // Azure TTS
} from 'agora-agents';
```

### Agent Configuration Pattern

```typescript
// 1. Create AgoraClient
const client = new AgoraClient({
  area: Area.US,
  appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
  appCertificate: process.env.AGORA_APP_CERTIFICATE!,
});

// 2. Build Agent with typed builder pattern
const agent = new Agent({
  client,
  instructions: systemPrompt,
  greeting: greetingMessage,
  maxHistory: 50,
})
  .withLlm(new Gemini({
    apiKey: process.env.GOOGLE_GENAI_API_KEY!,
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 1024,
  }))
  .withTts(new MicrosoftTTS({
    key: process.env.AZURE_SPEECH_KEY!,
    region: 'eastus',
    voiceName: 'hi-IN-SwaraNeural',
    speed: 1.0,
    volume: 70,
  }));

// 3. Create and start session
const session = agent.createSession({
  channel: channelName,
  agentUid: '9999',
  remoteUids: ['*'],
  expiresIn: ExpiresIn.hours(2),
  idleTimeout: 300,
});

const agentId = await session.start();
```

---

## 📡 REST API Payloads

### 1. Start Conversational AI Agent
* **Endpoint:** `POST /api/agora/agent/start`
* **Request Body:**
```json
{
  "channelName": "emergency_channel_1789",
  "agentUid": 9999,
  "userUid": 258412,
  "language": "hi-IN",
  "patientContext": {
    "name": "George",
    "medications": ["Lisinopril", "Metformin", "Amlodipine", "Simvastatin"]
  }
}
```
* **Response:**
```json
{
  "success": true,
  "session": {
    "agentId": "convo_agent_emergency_channel_1789_1725287600",
    "channelName": "emergency_channel_1789",
    "agentUid": 9999,
    "status": "running",
    "startedAt": "2026-09-02T15:00:00.000Z",
    "engine": "agora-conversational-ai-v2"
  },
  "message": "Agora Conversational AI Agent initialized and connected to channel"
}
```

### 2. Conversational Agent Tool Execution (Emergency Escalation)
* **Endpoint:** `POST /api/agora/agent/tool`
* **Request Body:**
```json
{
  "toolName": "escalateToHumanNurse",
  "channelName": "emergency_channel_1789",
  "arguments": {
    "reason": "Acute chest pain radiating to left arm",
    "severity": "critical",
    "language": "hi-IN"
  }
}
```
* **Response:**
```json
{
  "success": true,
  "toolName": "escalateToHumanNurse",
  "result": {
    "escalated": true,
    "ticketId": "ticket_1725287610",
    "channel": "emergency_channel_1789",
    "message": "Human nurse alert dispatched to dashboard. Audio bridge active."
  }
}
```

---

## 🛡️ Key Features of the Agora Conversational AI Integration

1. **Official Agora Agents SDK**: Uses the typed `agora-agents` npm package with `.withStt()`, `.withLlm()`, `.withTts()` builder pattern
2. **Bilingual Conversational Flow (`hi-IN` & `en-IN`):** The agent natively speaks and understands Hindi and English with natural turn-taking.
3. **Real-Time VAD & Interruption Handling:** Allows callers to interrupt the AI naturally.
4. **Automated Human Nurse Escalation:** Tool calls bridge the live human nurse into the same Agora RTC room while triggering the nurse dashboard's Web Audio harmonic emergency chime.
5. **Gemini LLM Integration:** Powered by Google's Gemini 2.0 Flash for fast, context-aware medical responses.
6. **Azure TTS Integration:** Uses Microsoft Azure Neural Voices for natural-sounding Hindi and English speech.

---

## 🔑 Required Environment Variables

```bash
# Agora Configuration (MANDATORY)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# Google Gemini LLM
GOOGLE_GENAI_API_KEY=your_google_api_key

# Azure Speech Service (TTS)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus
```
