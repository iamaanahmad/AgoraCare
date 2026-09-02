# 🎙️ Agora Conversational AI Engine Integration Guide

> **Project:** AgoraCare — AI-Powered Remote Healthcare & Real-Time Emergency Voice Escalation  
> **Engine:** Agora Conversational AI Engine (Server-Side AI Agent Orchestration, VAD, ASR, LLM, TTS & Webhooks)  
> **Track:** EchoSphere: Agora Conversational AI Hackathon  

---

## 🏗️ Architecture & How It Works

AgoraCare implements a full **Agora Conversational AI Agent architecture**. When a patient initiates a voice session, a server-side AI Agent (**Aria**) is provisioned into the Agora RTC channel, orchestrating real-time audio input, speech recognition, LLM reasoning, voice synthesis, and clinical tool execution:

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
| **Server AI Orchestrator** | [`src/lib/agora/convo-ai-service.ts`](file:///c:/Projects/AgoraCare/src/lib/agora/convo-ai-service.ts) | Core service managing Agora Conversational AI agent credentials, RTC token generation, LLM system prompts, VAD, and REST API dispatch. |
| **Agent Start Endpoint** | [`src/app/api/agora/agent/start/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/agent/start/route.ts) | Starts the Conversational AI Agent for a channel. |
| **Agent Stop Endpoint** | [`src/app/api/agora/agent/stop/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/agent/stop/route.ts) | Terminates the Conversational AI Agent session cleanly. |
| **Agent Tool Calling Webhook** | [`src/app/api/agora/agent/tool/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/agent/tool/route.ts) | Handles tool execution callbacks (`escalateToHumanNurse`, `getMedicationSchedule`). |
| **Client Voice Coordinator** | [`src/contexts/voice-context.tsx`](file:///c:/Projects/AgoraCare/src/contexts/voice-context.tsx) | Synchronizes client RTC connection with the backend Conversational AI Agent session. |
| **Dynamic RTC Token Issuer** | [`src/app/api/agora/token/route.ts`](file:///c:/Projects/AgoraCare/src/app/api/agora/token/route.ts) | Issues dynamic cryptographic Agora RTC tokens for both user and agent UIDs. |

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

1. **Bilingual Conversational Flow (`hi-IN` & `en-IN`):** The agent natively speaks and understands Hindi and English with natural turn-taking.
2. **Real-Time VAD & Interruption Handling:** Allows callers to interrupt the AI naturally.
3. **Automated Human Nurse Escalation:** Tool calls bridge the live human nurse into the same Agora RTC room while triggering the nurse dashboard's Web Audio harmonic emergency chime.
