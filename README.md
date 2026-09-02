# 🏥 AgoraCare - Voice AI Medical Triage & Remote Patient Care

> **Real-time, Multilingual Voice AI with Instant Human Escalation via Agora RTC**

AgoraCare is a real-time, multilingual Voice AI telehealth platform designed for remote patient care, medication adherence, and emergency triage. It acts as a frontline conversational healthcare assistant that can support patients in English and Hindi, monitor vitals, manage prescriptions, and intelligently escalate urgent emergencies to human nurses over crystal-clear real-time audio.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9-orange?logo=firebase)](https://firebase.google.com/)
[![Agora SDK](https://img.shields.io/badge/Agora-Conversational%20AI-blue?logo=agora)](https://www.agora.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

---

## 💡 System Overview & Core Capabilities

AgoraCare provides an intelligent, human-in-the-loop care coordination system designed to assist patients, seniors, and remote caregivers:

- 🗣️ **Multilingual & Code-Switched Interaction**: Supports English, Hindi, and Hinglish natively. The AI agent understands natural speech patterns, phonetic variations, and language switching during health inquiries.
- 🚨 **Intelligent Human Escalation**: When acute distress or medical emergencies are detected, the system immediately establishes a live **Agora RTC voice bridge** and notifies hospital triage nurses in real time.
- 🛡️ **Medical Safety Guardrails**: Built with strict conversational guardrails that prioritize emergency dispatch and informational support without offering unauthorized clinical diagnoses.
- 📋 **Integrated Patient Care Suite**: Includes daily medication scheduling with adherence tracking, interactive cardiovascular vitals charts, and prescription OCR digitization.

## ✨ Features

### 1. 🎙️ Agora Conversational AI Engine Agent
- Built on the **Agora Conversational AI Engine** ([`src/lib/agora/convo-ai-service.ts`](file:///c:/Projects/AgoraCare/src/lib/agora/convo-ai-service.ts) & [`AGORA_CONVERSATIONAL_AI.md`](file:///c:/Projects/AgoraCare/AGORA_CONVERSATIONAL_AI.md)).
- Server-side AI Agent (**Aria**) provisioned directly into the RTC channel with VAD, ASR, LLM reasoning, and natural voice synthesis.
- Intelligent tool-calling webhooks (`/api/agora/agent/tool`) trigger instant human nurse escalation.

### 2. 👨‍💻 Live Agent Dashboard (Human-in-the-loop)
- A dedicated web interface (`/agent`) for human operators.
- Real-time synchronization of active escalation tickets.
- Web Audio API harmonic emergency alert chime rings automatically when patient emergency calls arrive.

### 3. 🎨 Premium Modern UI
- Redesigned with a stunning Slate/Zinc aesthetic and modern medical blue accents.
- Uses elegant glassmorphism (`backdrop-blur`) and micro-animations for a polished, professional feel.
- Fully responsive layout tailored for both mobile patients and desktop nurse stations.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS 3.4, Radix UI
- **Voice & AI Engine**: **Agora Conversational AI Engine** & Agora RTC Web SDK v4
- **Backend & Database**: Firebase 11.9 (Firestore, Auth)
- **AI Orchestration**: Google Gemini 2.5 Flash & Genkit AI (Prompt structuring, intent routing, safety guardrails)
- **Deployment**: Vercel Production Deployment Ready

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Firebase project with Firestore and Auth enabled
- Agora account with Conversational AI SDK credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/iamaanahmad/AgoraCare.git
cd AgoraCare

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

### Run Development Server

```bash
# Start Next.js development server
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser. 
To view the Live Agent Dashboard, navigate to [http://localhost:9002/agent](http://localhost:9002/agent).

---

<div align="center">

**Built for the EchoSphere Hackathon**

**Powered by Agora Conversational AI SDK**

</div>
