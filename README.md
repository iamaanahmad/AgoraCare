# 🏥 AgoraCare - Voice AI Medical Triage Agent

> **Built for EchoSphere: Agora Conversational AI Hackathon (Track 5)**

AgoraCare is a real-time, multilingual Voice AI agent designed for non-clinical medical triage and support lines. It acts as a frontline conversational agent that can handle stressed callers, collect essential information, and intelligently escalate the call to a human operator when necessary.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9-orange?logo=firebase)](https://firebase.google.com/)
[![Agora SDK](https://img.shields.io/badge/Agora-Conversational%20AI-blue?logo=agora)](https://www.agora.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Track 5: Multilingual Assistance-Line Agent with Human Escalation

This project was specifically tailored for the **EchoSphere Hackathon - Track 5**. It addresses the challenge of building a voice AI agent that can handle complex, multi-lingual callers while strictly adhering to safety guardrails (no medical advice).

### Key Hackathon Requirements Met:
- ✅ **Multilingual & Code-Switched Interaction**: Supports English and Hindi natively. The AI understands when a user switches languages or uses phrases like *"bohot dard hai"* (I am in a lot of pain).
- ✅ **Human Escalation with Context**: When the AI detects distress or an explicit request for a human, it summarizes the conversation and instantly pushes a ticket to the real-time **Live Agent Dashboard**.
- ✅ **Safety Guardrails**: Strict system prompts prevent the AI from giving medical diagnoses, ensuring it acts only as an information-gathering triage layer.
- ✅ **Ticketing System Integration**: Built on top of Firebase Firestore (`support_tickets`), allowing human operators to monitor and "Accept Calls" in real-time.

---

## ✨ Features

### 1. 🎤 Multilingual Voice Triage
- Powered by the **Agora Conversational AI SDK**.
- Capable of calmly collecting patient information, symptoms, and the reason for the call.
- Handles interruptions naturally and adapts to the caller's pace.

### 2. 👨‍💻 Live Agent Dashboard (Human-in-the-loop)
- A dedicated web interface (`/agent`) for human operators.
- Real-time synchronization of active escalation tickets.
- Operators can view the AI's generated summary before accepting the call.

### 3. 🎨 Premium Modern UI
- Redesigned for the hackathon with a stunning Slate/Zinc aesthetic and modern blue accents.
- Uses elegant glassmorphism (`backdrop-blur`) and micro-animations for a polished, professional feel.
- Fully responsive layout tailored for both users and human operators.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS 3.4, Radix UI
- **Voice & RTC**: Agora Conversational AI SDK (Real-time voice layer)
- **Backend & Database**: Firebase 11.9 (Firestore, Auth)
- **AI Orchestration**: Genkit AI (Prompt structuring, intent routing)
- **Deployment**: Localhost / Cloud (Ready)

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
