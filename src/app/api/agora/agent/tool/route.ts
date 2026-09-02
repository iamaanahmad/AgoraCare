import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      toolName,
      arguments: toolArgs,
      channelName,
      patientId = 'george-patient-profile',
      patientName = 'George (Patient)',
    } = body;

    console.log(`[Agora Conversational AI Tool] Executing tool ${toolName} for channel ${channelName}:`, toolArgs);

    if (toolName === 'escalateToHumanNurse') {
      const ticketId = `ticket_${Date.now()}`;
      await setDoc(doc(db, 'support_tickets', ticketId), {
        id: ticketId,
        patientId,
        patientName,
        status: 'open',
        summary: toolArgs?.reason || 'Critical Emergency Escalated by Agora Conversational AI Agent',
        reason: toolArgs?.reason || 'Acute distress detected by voice AI',
        detectedLanguage: toolArgs?.language || 'en-IN',
        agoraChannel: channelName || ticketId,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'agora-conversational-ai-engine',
      });

      return NextResponse.json({
        success: true,
        toolName,
        result: {
          escalated: true,
          ticketId,
          channel: channelName || ticketId,
          message: 'Human nurse alert dispatched to dashboard. Audio bridge active.',
        },
      });
    }

    if (toolName === 'getMedicationSchedule') {
      const schedule = {
        lisinopril: '10mg in the morning at 8:00 AM with breakfast for blood pressure.',
        metformin: '500mg in the afternoon at 1:00 PM with lunch for blood sugar.',
        amlodipine: '5mg in the evening at 6:30 PM with dinner for blood pressure.',
        simvastatin: '20mg at bedtime at 9:00 PM for cholesterol.',
      };

      const requestedMed = (toolArgs?.medicationName || '').toLowerCase();
      let foundInfo = 'Please consult your schedule in the medications tab.';
      for (const [key, val] of Object.entries(schedule)) {
        if (requestedMed.includes(key)) {
          foundInfo = val;
          break;
        }
      }

      return NextResponse.json({
        success: true,
        toolName,
        result: { scheduleInfo: foundInfo },
      });
    }

    return NextResponse.json({
      success: true,
      toolName,
      result: { status: 'acknowledged' },
    });
  } catch (error: any) {
    console.error('Error in Agora Conversational AI tool execution:', error);
    return NextResponse.json(
      { error: error.message || 'Tool execution failed' },
      { status: 500 }
    );
  }
}
