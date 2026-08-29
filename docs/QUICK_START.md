# 🚀 Quick Start Guide - AgoraCare

**Last Updated:** November 14, 2025

This guide will help you get AgoraCare running locally in under 10 minutes.

---

## ⚡ Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 20+** and npm installed ([Download](https://nodejs.org/))
- ✅ **Git** installed ([Download](https://git-scm.com/))
- ✅ **Firebase account** (free tier works) ([Sign up](https://firebase.google.com/))
- ✅ **Agora account** with Conversational AI SDK access ([Sign up](https://www.agora.io/))
- ✅ **Google Cloud account** for Vision API (free tier works) ([Sign up](https://cloud.google.com/))

---

## 📦 Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/agoracare.git
cd agoracare

# Install dependencies
npm install
```

**Expected time:** 2-3 minutes

---

## 🔥 Step 2: Set Up Firebase

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "AgoraCare" (or your preferred name)
4. Disable Google Analytics (optional for demo)
5. Click "Create project"

### 2.2 Enable Firebase Services

**Authentication:**
1. Go to Authentication → Get Started
2. Enable "Email/Password"
3. Enable "Google" sign-in
4. Enable "Phone" sign-in (optional)

**Firestore Database:**
1. Go to Firestore Database → Create database
2. Start in "Test mode" (for demo)
3. Choose your region (closest to you)

**Storage:**
1. Go to Storage → Get Started
2. Start in "Test mode" (for demo)

**Cloud Messaging:**
1. Go to Cloud Messaging
2. Note your Sender ID

### 2.3 Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" → Click web icon (</>)
3. Register app as "AgoraCare Web"
4. Copy the config object

---

## 🎤 Step 3: Set Up Agora

### 3.1 Create Agora Project

1. Go to [Agora Console](https://console.agora.io/)
2. Click "Create Project"
3. Name it "AgoraCare"
4. Choose "Secured mode: APP ID + Token"
5. Click "Submit"

### 3.2 Enable Conversational AI SDK

1. In your project, go to "Products & Usage"
2. Enable "Conversational AI"
3. Enable "Real-Time Communication (RTC)"
4. Note your App ID and App Certificate

### 3.3 Get API Credentials

1. Go to "RESTful API" section
2. Note your Customer ID and Customer Secret

---

## 🔍 Step 4: Set Up Google Cloud Vision

### 4.1 Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project "AgoraCare"
3. Enable billing (free tier: 1000 requests/month)

### 4.2 Enable Vision API

1. Go to "APIs & Services" → "Library"
2. Search for "Cloud Vision API"
3. Click "Enable"

### 4.3 Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. (Optional) Restrict key to Vision API only

---

## 🤖 Step 5: Set Up Google Generative AI (for Genkit)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key

---

## 📱 Step 6: Set Up Twilio (Optional - for SMS)

If you want SMS notifications for emergencies:

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Get a phone number (free trial works)
3. Note your Account SID and Auth Token

**Skip this step if you only want push notifications.**

---

## ⚙️ Step 7: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Open `.env.local` and fill in your credentials:

```env
# Firebase (from Step 2.3)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agoracare-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agoracare-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agoracare-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx

# Agora (from Step 3)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret

# Google Cloud Vision (from Step 4)
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...

# Google Generative AI (from Step 5)
GOOGLE_GENAI_API_KEY=AIzaSy...

# Twilio (from Step 6 - optional)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

---

## 🚀 Step 8: Run the Application

### Start Development Server

```bash
# Terminal 1: Start Next.js
npm run dev
```

```bash
# Terminal 2: Start Genkit AI (in a new terminal)
npm run genkit:dev
```

### Access the Application

- **Main App:** [http://localhost:9002](http://localhost:9002)
- **Genkit Dev UI:** [http://localhost:4000](http://localhost:4000)

**Expected time:** 30 seconds to start

---

## 🎉 Step 9: Test the Application

### Create Your First Account

1. Open [http://localhost:9002](http://localhost:9002)
2. Click "Sign Up"
3. Use Google sign-in or email/password
4. Complete onboarding:
   - Create your first profile
   - Add an emergency contact
   - Skip calendar connection (optional)

### Try Key Features

**1. Add a Medication (Voice or Text)**
- Click "Add Medication"
- Say or type: "Metformin 500mg twice daily with meals"
- Confirm the schedule

**2. Upload a Prescription**
- Go to "Prescriptions"
- Upload a sample prescription image
- Wait for OCR and AI summary (3-5 seconds)
- Click "Add to Schedule"

**3. Book an Appointment**
- Go to "Appointments"
- Click "Book Appointment"
- Describe symptoms: "I have a persistent cough and fever"
- See AI recommendations
- Select a date and time

**4. Test Emergency Feature**
- Go to "Emergency"
- See large accessible buttons
- (Don't actually trigger unless you have test contacts set up)

**5. Try Caregiver Dashboard**
- Create a second profile (e.g., family member)
- Add medications to both profiles
- View the dashboard to see all medications

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 9002
npx kill-port 9002

# Or use a different port
npm run dev -- -p 3000
```

### Firebase Connection Error

- Check that all Firebase services are enabled
- Verify `.env.local` has correct credentials
- Ensure Firestore is in "Test mode" for development

### Agora SDK Error

- Verify App ID and Certificate are correct
- Check that Conversational AI is enabled in Agora Console
- Ensure you're using the correct region

### OCR Not Working

- Verify Google Cloud Vision API is enabled
- Check API key has proper permissions
- Ensure billing is enabled (free tier works)

### Genkit AI Error

- Verify `GOOGLE_GENAI_API_KEY` is set
- Check that you're running `npm run genkit:dev`
- Try restarting the Genkit server

---

## 📚 Next Steps

### For Developers

- Read [Architecture Guide](ARCHITECTURE.md)
- Explore [API Documentation](API.md)
- Check [Contributing Guidelines](CONTRIBUTING.md)

### For Demo/Presentation

- Load demo data: `npm run seed:demo`
- Review [Demo Script](DEMO_SCRIPT.md)
- Practice voice commands from [Voice Commands Guide](VOICE_COMMANDS.md)

### For Production Deployment

- Set up Firebase security rules
- Configure production environment variables
- Enable Firebase App Check
- Set up monitoring and analytics

---

## 💡 Tips for Best Experience

1. **Use Chrome or Edge** for best voice recognition
2. **Allow microphone access** when prompted
3. **Use headphones** to avoid echo in voice calls
4. **Test on mobile** for full experience
5. **Create multiple profiles** to see caregiver features

---

## 🆘 Need Help?

- **Documentation:** [docs/](.)
- **Issues:** [GitHub Issues](https://github.com/yourusername/agoracare/issues)
- **Discord:** [Join our community](https://discord.gg/agoracare)
- **Email:** team@agoracare.health

---

## ✅ Verification Checklist

Before demo/submission, verify:

- [ ] Firebase authentication works (Google sign-in)
- [ ] Can create and switch profiles
- [ ] Can add medications via voice or text
- [ ] Medication reminders appear (test with 1-minute schedule)
- [ ] Can upload and process prescription image
- [ ] Appointment booking flow works
- [ ] Emergency buttons are visible and accessible
- [ ] Dashboard shows all profiles and medications
- [ ] Voice commands are recognized
- [ ] No console errors in browser

---

<div align="center">

**You're all set! 🎉**

**Start building the future of healthcare with AgoraCare**

[Main README](../README.md) • [Architecture](ARCHITECTURE.md) • [API Docs](API.md)

</div>
