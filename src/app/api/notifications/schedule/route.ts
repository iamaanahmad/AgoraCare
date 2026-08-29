import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import {
  scheduleMedicationReminders,
  scheduleAllMedicationReminders,
} from '@/lib/notification-scheduler';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      console.warn('Firebase Admin missing credentials, initializing with defaults');
      initializeApp();
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, profileId, medicationId, daysAhead = 7 } = body;

    if (!userId || !profileId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const firestore = getFirestore() as any;

    let count = 0;

    if (medicationId) {
      // Schedule for specific medication
      const { getMedication } = await import('@/firebase/firestore/medications');
      const medication = await getMedication(firestore, userId, profileId, medicationId);

      if (!medication) {
        return NextResponse.json(
          { error: 'Medication not found' },
          { status: 404 }
        );
      }

      const notificationIds = await scheduleMedicationReminders(
        firestore,
        userId,
        profileId,
        medication,
        daysAhead
      );
      count = notificationIds.length;
    } else {
      // Schedule for all medications
      count = await scheduleAllMedicationReminders(
        firestore,
        userId,
        profileId,
        daysAhead
      );
    }

    return NextResponse.json({
      success: true,
      count,
      message: `Scheduled ${count} reminder(s)`,
    });
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    return NextResponse.json(
      { error: 'Failed to schedule reminders' },
      { status: 500 }
    );
  }
}
