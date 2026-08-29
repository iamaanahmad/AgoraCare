import { NextRequest, NextResponse } from 'next/server';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
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
 * Send push notification using Firebase Cloud Messaging
 */
export async function POST(request: NextRequest) {
  try {
    const { email, title, body, data, token } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // In development mode, just log the notification
    if (process.env.NODE_ENV === 'development' || !token) {
      console.log('Push notification would be sent:');
      console.log('To:', email || token);
      console.log('Title:', title);
      console.log('Body:', body);
      console.log('Data:', data);
      
      return NextResponse.json({
        success: true,
        messageId: `mock_${Date.now()}`,
        message: 'Push notification sent (development mode)',
      });
    }

    // Send push notification using FCM
    const messaging = getMessaging();
    
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token, // FCM device token
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'emergency_alert',
          priority: 'max' as const,
          channelId: 'emergency',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'emergency_alert.mp3',
            badge: 1,
            'content-available': 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
      },
    };

    const response = await messaging.send(message);

    return NextResponse.json({
      success: true,
      messageId: response,
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send push notification',
      },
      { status: 500 }
    );
  }
}
