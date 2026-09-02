import { NextRequest, NextResponse } from 'next/server';
import { supportTriage } from '@/ai/flows/support-triage';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize singleton Firestore instance for API routes
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const { message, patientId = 'george-patient-profile', patientName = 'George (Patient)' } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Run Genkit Support Triage Flow
    const triageResult = await supportTriage({
      transcript: message,
    });

    let ticketId: string | null = null;

    // If severe or emergency, create a support ticket in Firestore
    if (triageResult.escalateToHuman) {
      ticketId = `ticket_${Date.now()}`;
      try {
        await setDoc(doc(db, 'support_tickets', ticketId), {
          id: ticketId,
          patientId,
          patientName,
          status: 'open',
          summary: triageResult.understanding || 'Voice AI Triage Escalation',
          reason: triageResult.escalationReason || 'Patient reported critical distress or emergency',
          detectedLanguage: triageResult.detectedLanguage || 'mixed',
          agoraChannel: ticketId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (err) {
        console.warn('Could not persist support ticket to Firestore directly in API route:', err);
      }
    }

    return NextResponse.json({
      success: true,
      understanding: triageResult.understanding,
      escalateToHuman: triageResult.escalateToHuman,
      escalationReason: triageResult.escalationReason,
      response: triageResult.suggestedResponse,
      detectedLanguage: triageResult.detectedLanguage,
      ticketId,
    });
  } catch (error) {
    console.error('Error in AI chat route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal Server Error',
        response: 'Main samajh raha hoon ki aapko madad chahiye. Kripya thoda intezaar karein, hum doctor se contact kar rahe hain.',
        escalateToHuman: true,
      },
      { status: 500 }
    );
  }
}
