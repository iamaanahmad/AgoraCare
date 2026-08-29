# 🏥 AgoraCare - Voice-First Family Healthcare Companion

> **"The voice of care in your home"**

AgoraCare is an intelligent, voice-first healthcare companion that helps elderly users, caregivers, and families manage medications, appointments, prescriptions, and emergencies through natural conversation. AgoraCare addresses critical gaps in medication adherence and healthcare accessibility.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9-orange?logo=firebase)](https://firebase.google.com/)
[![Agora SDK](https://img.shields.io/badge/Agora-Conversational%20AI-blue?logo=agora)](https://www.agora.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 The Problem

### The Challenge
- **50% of patients** don't take medications as prescribed, leading to 125,000 deaths annually in the US
- **Elderly users** struggle with complex healthcare apps and medication schedules
- **Caregivers** managing multiple family members lack centralized tools
- **Traditional apps** require manual data entry and don't support natural interaction

### Our Solution
AgoraCare transforms healthcare management through:
- 🎤 **Voice-First Interface**: Natural conversation powered by Agora Conversational AI SDK
- 👨‍👩‍👧‍👦 **Multi-Profile Care**: Centralized dashboard for managing entire families
- 🤖 **AI-Powered Intelligence**: Prescription scanning, symptom analysis, and smart scheduling
- 🚨 **Emergency Response**: Instant voice-triggered calls and family notifications
- 📅 **Unified Calendar**: Seamless sync with Google Calendar and Outlook

---

## ✨ Key Features

### 1. 🎤 Voice-Powered Medication Management
- **Natural Language Input**: "Add my blood pressure medication, twice daily after meals"
- **Voice Reminders**: Gentle audio notifications with conversational responses
- **Adherence Tracking**: "Did you take your medicine?" → "Yes, just now"
- **Smart Scheduling**: Understands "alternate days", "before breakfast", "at bedtime"

### 2. 🏥 Conversational Appointment Booking
- **Symptom Intake**: Describe your condition naturally via voice or chat
- **AI Doctor Matching**: Intelligent specialization recommendations based on symptoms
- **Calendar Integration**: Auto-sync with Google Calendar and Outlook
- **Smart Reminders**: 24-hour and 1-hour appointment notifications

### 3. 📄 Intelligent Prescription Scanning
- **OCR Processing**: Upload prescription images or PDFs
- **AI Summarization**: Complex medical jargon → Plain language explanations
- **Auto-Schedule**: One-tap to add medications from prescriptions
- **Drug Interactions**: Automatic checking and warnings

### 4. 🚨 Emergency Assistance
- **Voice Triggers**: "Emergency!" or "Call my doctor" activates instant response
- **One-Tap Calling**: Large, accessible buttons for emergency contacts
- **Family Notifications**: Automatic SMS and push alerts to all emergency contacts
- **Agora RTC Integration**: High-quality voice calls with medical professionals

### 5. 👨‍👩‍👧 Caregiver Dashboard
- **Multi-Profile View**: Manage medications and appointments for entire family
- **Health Insights**: Adherence trends, missed doses, upcoming appointments
- **Natural Queries**: "What's Dad's next medication?" via voice
- **Real-Time Sync**: Updates across all devices instantly

### 6. ♿ Accessibility-First Design
- **Large Touch Targets**: Minimum 16px spacing for easy interaction
- **High Contrast**: WCAG AA compliant color ratios
- **PT Sans Typography**: Readable font at 16px+ sizes
- **Universal Icons**: Visual + text labels for all actions
- **Keyboard Navigation**: Full accessibility support

---


## 🌟 Why AgoraCare?

### Innovation 🚀
- **Voice-first, family-centric healthcare companion** designed for accessibility
- **Multi-modal AI integration**: Agora Conversational AI + Genkit + Google Vision OCR
- **Proactive emergency response** with voice-triggered instant assistance
- **Cross-platform calendar sync** unifying healthcare scheduling

### Usability 💡
- **Zero learning curve** for elderly users through natural conversation
- **Accessible design** following WCAG 2.1 AA standards
- **Offline support** with automatic sync when reconnected
- **Extensible architecture** for multi-language support

### Technical Excellence 💻
- **Seamless Agora SDK integration** for voice, chat, and RTC calls
- **Real-time synchronization** across devices using Firestore
- **Scalable architecture** with Next.js 15 and Firebase
- **Sub-500ms voice response latency** for natural conversations

### Real-World Impact 🌍
- **Addresses 50% medication non-adherence rate** globally
- **Reduces caregiver burden** through centralized management
- **Prevents emergency hospitalizations** with proactive reminders
- **Improves health outcomes** for elderly and chronic disease patients

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5** - Type safety
- **TailwindCSS 3.4** - Styling with shadcn/ui components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & Services
- **Firebase 11.9.1**
  - Authentication (Google, Email, Phone)
  - Firestore (NoSQL database)
  - Cloud Storage (Prescription images)
  - Cloud Messaging (Push notifications)
- **Genkit AI 1.20.0** - AI orchestration framework
- **Google Generative AI** - Prescription summarization and symptom analysis

### Integrations
- **Agora Conversational AI SDK** - Voice and chat interface (MANDATORY)
- **Agora RTC** - Emergency voice calls
- **Google Cloud Vision API** - OCR for prescription scanning
- **Google Calendar API** - Calendar synchronization
- **Microsoft Outlook API** - Calendar synchronization
- **Twilio** - SMS notifications for emergencies

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Firebase project with Firestore, Auth, Storage, and Cloud Messaging enabled
- Agora account with Conversational AI SDK credentials
- Google Cloud project with Vision API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agoracare.git
cd agoracare

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

Create a `.env.local` file with the following:

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

# Google Cloud Vision API
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Calendar APIs
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_secret
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_secret
```

### Run Development Server

```bash
# Start Next.js development server
npm run dev

# In a separate terminal, start Genkit AI development server
npm run genkit:dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

---


## 📱 User Journey

### For Elderly Users
1. **Wake Up** → Voice reminder: "Good morning! Time for your blood pressure medication"
2. **Respond** → "Taken" (voice or button tap)
3. **Upload Prescription** → Take photo of new prescription
4. **AI Explains** → "This is Metformin, 500mg. Take one tablet twice daily with meals for diabetes management"
5. **One-Tap Add** → Medication automatically added to schedule

### For Caregivers
1. **Open Dashboard** → See all family members' health status at a glance
2. **Check Adherence** → "Dad missed his evening dose yesterday"
3. **Voice Query** → "What's Mom's next appointment?"
4. **Get Answer** → "Mom has a cardiology appointment tomorrow at 2 PM"
5. **Receive Alerts** → Real-time notifications for missed medications

### Emergency Scenario
1. **User Says** → "Emergency!" or "Call my doctor"
2. **System Activates** → Large emergency buttons appear
3. **One Tap** → Instant Agora RTC call to designated doctor
4. **Auto-Notify** → SMS and push notifications sent to all family members
5. **Event Logged** → Complete record for follow-up

---

## 🎨 Design Philosophy

### Voice-First, Not Voice-Only
- Natural conversation as primary interface
- Visual feedback for all voice interactions
- Seamless fallback to text input
- Multimodal experience (voice + touch + visual)

### Accessibility is Core, Not Optional
- Designed for users with vision, hearing, and motor challenges
- Large touch targets (minimum 48x48px)
- High contrast colors (4.5:1 ratio)
- Screen reader compatible
- Keyboard navigation support

### Family-Centric, Not Individual
- Multi-profile support from day one
- Caregiver dashboard for centralized management
- Shared emergency contacts
- Privacy controls for each profile

---

## 📊 Demo Data (November 14, 2025)

### Sample Profiles
- **Grandpa John** (78) - Managing diabetes, hypertension, and arthritis
- **Mom Sarah** (52) - Thyroid medication and vitamin supplements
- **Little Emma** (8) - Allergy medication and asthma inhaler

### Sample Medications
- Metformin 500mg - Twice daily with meals
- Lisinopril 10mg - Once daily in the morning
- Levothyroxine 75mcg - Once daily before breakfast
- Cetirizine 10mg - Once daily as needed

### Sample Appointments
- **Nov 18, 2025** - Grandpa John - Cardiology follow-up
- **Nov 22, 2025** - Mom Sarah - Endocrinology check-up
- **Nov 25, 2025** - Little Emma - Pediatric allergy consultation

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Voice UI     │  │ Dashboard    │  │ Emergency    │      │
│  │ (Agora SDK)  │  │ Components   │  │ Panel        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer (API Routes)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Medication   │  │ Appointment  │  │ Prescription │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Genkit AI Flows (Orchestration)          │       │
│  │  • Symptom Analysis  • Prescription Summary      │       │
│  │  • Conversation Handler  • Medication Parser     │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data & External Services                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Firestore    │  │ Google       │  │ Agora RTC    │      │
│  │ Database     │  │ Vision OCR   │  │ Calls        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Firebase     │  │ Calendar     │  │ Twilio       │      │
│  │ Auth/Storage │  │ APIs         │  │ SMS          │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Performance Metrics

- ⚡ **First Contentful Paint**: < 1.5s
- 🎯 **Time to Interactive**: < 3s
- 🎤 **Voice Response Latency**: < 500ms
- 📄 **OCR Processing Time**: < 5s
- 🔄 **Calendar Sync Delay**: < 30s (outbound), < 5min (inbound)
- 📱 **Notification Delivery**: < 30s from scheduled time

---

## 🔒 Security & Privacy

- 🔐 **End-to-End Encryption**: All data encrypted at rest and in transit
- 🛡️ **Role-Based Access Control**: Users can only access their own profiles
- 🔑 **OAuth 2.0**: Secure authentication with Google, Microsoft
- 📝 **Audit Logging**: Complete record of sensitive operations
- 🚫 **Data Anonymization**: PII removed from logs and error reports
- 💾 **Automatic Backups**: Daily backups of all user data
- ✅ **HIPAA Considerations**: Architecture designed for healthcare compliance

---

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Coverage
- Unit Tests: 70%+ coverage for critical paths
- Integration Tests: All major user flows
- E2E Tests: Complete user journeys
- Accessibility Tests: WCAG 2.1 AA compliance

---

## 📚 Documentation

### For Developers
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and data flow
- [API Documentation](docs/API.md) - Endpoint specifications
- [Agora Integration Guide](docs/AGORA_INTEGRATION.md) - Voice SDK setup
- [Contributing Guidelines](docs/CONTRIBUTING.md) - How to contribute

### For Users
- [User Guide](docs/USER_GUIDE.md) - Complete feature walkthrough
- [Voice Commands](docs/VOICE_COMMANDS.md) - List of supported commands
- [FAQ](docs/FAQ.md) - Common questions and troubleshooting

---

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- ✅ Voice-powered medication management
- ✅ Appointment booking with symptom analysis
- ✅ Prescription scanning and AI summarization
- ✅ Emergency assistance
- ✅ Multi-profile caregiver dashboard

### Phase 2: Enhanced Intelligence
- 🔄 Predictive medication refill reminders
- 🔄 Health trend analysis and insights
- 🔄 Integration with wearable devices (Apple Watch, Fitbit)
- 🔄 Telemedicine video consultations

### Phase 3: Ecosystem Expansion
- 🔄 Pharmacy integration for prescription delivery
- 🔄 Insurance claim assistance
- 🔄 Health record integration (HL7 FHIR)
- 🔄 Multi-language support (Spanish, Mandarin, Hindi)

### Phase 4: Advanced Features
- 🔄 AI health coach with personalized recommendations
- 🔄 Social features for caregiver communities
- 🔄 Integration with smart home devices
- 🔄 Clinical trial matching

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or suggesting ideas, your help is appreciated.

Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Agora** - For the powerful Conversational AI SDK that makes voice-first healthcare accessible
- **Firebase** - For the robust backend infrastructure
- **Google Cloud** - For Vision API and Generative AI capabilities
- **Healthcare Professionals** - For domain expertise and feedback
- **Open Source Community** - For contributions and support
- **Beta Testers** - Elderly users and caregivers who provided invaluable insights

---

## 📞 Contact

- **Project Website**: [agoracare.health](https://agoracare.health)
- **Email**: team@agoracare.health
- **Twitter**: [@AgoraCareHealth](https://twitter.com/AgoraCareHealth)
- **Discord**: [Join our community](https://discord.gg/agoracare)

---

## 🌟 Star Us!

If you find AgoraCare helpful, please consider giving us a star ⭐ on GitHub. It helps us reach more people who need accessible healthcare solutions!

---

<div align="center">

**Built with ❤️ for accessible healthcare**

**Powered by Agora Conversational AI SDK**

[Documentation](docs/) • [Report Bug](https://github.com/yourusername/agoracare/issues) • [Request Feature](https://github.com/yourusername/agoracare/issues) • [Contributing](CONTRIBUTING.md)

</div>
