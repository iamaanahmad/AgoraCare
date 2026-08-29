import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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

/**
 * API endpoint to schedule appointment reminders
 * This should be called by a cron job or Cloud Scheduler
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, profileId, appointmentId } = await request.json();

    if (!userId || !profileId || !appointmentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // Get the appointment
    const appointmentRef = db
      .collection('users')
      .doc(userId)
      .collection('profiles')
      .doc(profileId)
      .collection('appointments')
      .doc(appointmentId);

    const appointmentDoc = await appointmentRef.get();

    if (!appointmentDoc.exists) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const appointment = appointmentDoc.data();
    const appointmentTime = appointment?.dateTime?.toDate();

    if (!appointmentTime) {
      return NextResponse.json(
        { error: 'Invalid appointment time' },
        { status: 400 }
      );
    }

    const now = new Date();
    const twentyFourHoursBefore = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    const oneHourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000);

    const remindersScheduled: string[] = [];

    // Schedule 24-hour reminder
    if (!appointment.remindersSent?.[0] && twentyFourHoursBefore > now) {
      const notificationRef = await db.collection('notifications').add({
        userId,
        profileId,
        type: 'appointment-reminder',
        title: 'Appointment Tomorrow',
        body: `Reminder: You have an appointment with ${appointment.doctorName} tomorrow at ${appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        data: {
          appointmentId,
          doctorName: appointment.doctorName,
          specialization: appointment.specialization,
          appointmentTime: appointmentTime.toISOString(),
          location: appointment.location,
          reminderType: '24-hour',
        },
        scheduledFor: twentyFourHoursBefore,
        status: 'scheduled',
        priority: 'normal',
        requireInteraction: false,
        read: false,
        actionUrl: `/appointments?id=${appointmentId}`,
        createdAt: now,
      });

      remindersScheduled.push(notificationRef.id);
    }

    // Schedule 1-hour reminder
    if (!appointment.remindersSent?.[1] && oneHourBefore > now) {
      const notificationRef = await db.collection('notifications').add({
        userId,
        profileId,
        type: 'appointment-reminder',
        title: 'Appointment in 1 Hour',
        body: `Your appointment with ${appointment.doctorName} is in 1 hour at ${appointment.location}`,
        data: {
          appointmentId,
          doctorName: appointment.doctorName,
          specialization: appointment.specialization,
          appointmentTime: appointmentTime.toISOString(),
          location: appointment.location,
          reminderType: '1-hour',
        },
        scheduledFor: oneHourBefore,
        status: 'scheduled',
        priority: 'high',
        requireInteraction: true,
        read: false,
        actionUrl: `/appointments?id=${appointmentId}`,
        createdAt: now,
      });

      remindersScheduled.push(notificationRef.id);
    }

    return NextResponse.json({
      success: true,
      remindersScheduled: remindersScheduled.length,
      notificationIds: remindersScheduled,
    });
  } catch (error) {
    console.error('Error scheduling appointment reminders:', error);
    return NextResponse.json(
      { error: 'Failed to schedule reminders' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to check and send due appointment reminders
 * This should be called by a cron job every 5-10 minutes
 */
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Get all scheduled appointment reminders that should be sent within the next 5 minutes
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('type', '==', 'appointment-reminder')
      .where('status', '==', 'scheduled')
      .where('scheduledFor', '<=', fiveMinutesFromNow)
      .get();

    let sent = 0;
    let failed = 0;

    for (const doc of notificationsSnapshot.docs) {
      const notification = doc.data();
      const scheduledFor = notification.scheduledFor?.toDate();

      // Check if it's actually time to send (within 30 seconds)
      if (scheduledFor && scheduledFor <= now) {
        try {
          // Here you would integrate with your push notification service
          // For now, we'll just mark it as sent
          await doc.ref.update({
            status: 'sent',
            sentAt: now,
          });

          // Update the appointment's remindersSent array
          if (notification.data?.appointmentId && notification.data?.reminderType) {
            const reminderIndex = notification.data.reminderType === '24-hour' ? 0 : 1;
            const appointmentRef = db
              .collection('users')
              .doc(notification.userId)
              .collection('profiles')
              .doc(notification.profileId)
              .collection('appointments')
              .doc(notification.data.appointmentId);

            const appointmentDoc = await appointmentRef.get();
            if (appointmentDoc.exists) {
              const remindersSent = appointmentDoc.data()?.remindersSent || [false, false];
              remindersSent[reminderIndex] = true;
              await appointmentRef.update({ remindersSent });
            }
          }

          sent++;
        } catch (error) {
          console.error('Error sending notification:', error);
          await doc.ref.update({ status: 'failed' });
          failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: notificationsSnapshot.size,
    });
  } catch (error) {
    console.error('Error processing appointment reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
