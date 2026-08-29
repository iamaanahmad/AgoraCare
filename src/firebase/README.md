# Firebase Setup Documentation

## Overview

This directory contains the Firebase configuration and utilities for AgoraCare. The setup includes:

- **Authentication**: Google, Email/Password, and Phone authentication
- **Firestore**: NoSQL database for user data, profiles, medications, appointments
- **Storage**: File storage for prescription images and user avatars
- **Cloud Messaging**: Push notifications for medication reminders and appointments

## File Structure

```
src/firebase/
├── index.ts                    # Firebase initialization and SDK exports
├── config.ts                   # Firebase project configuration
├── provider.tsx                # React context provider for Firebase services
├── client-provider.tsx         # Client-side Firebase provider wrapper
├── storage.ts                  # Storage utilities for file uploads
├── messaging.ts                # Cloud Messaging utilities for notifications
├── firestore/
│   ├── users.ts               # User and profile management functions
│   ├── use-collection.ts      # Hook for Firestore collections
│   └── use-doc.ts             # Hook for Firestore documents
└── README.md                   # This file
```

## Setup Instructions

### 1. Firebase Project Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Google, Email/Password, Phone)
   - Firestore Database
   - Storage
   - Cloud Messaging

3. Copy your Firebase configuration from Project Settings > General > Your apps
4. Update `src/firebase/config.ts` with your configuration

### 2. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

### 3. Authentication Setup

#### Google Authentication
1. Go to Authentication > Sign-in method in Firebase Console
2. Enable Google provider
3. Add authorized domains (localhost for development)

#### Email/Password Authentication
1. Enable Email/Password provider in Firebase Console
2. Optionally enable email verification

#### Phone Authentication
1. Enable Phone provider in Firebase Console
2. Add test phone numbers for development (optional)
3. Configure reCAPTCHA settings

### 4. Firestore Security Rules

Deploy the security rules from `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

The rules enforce:
- User-owned data access
- Caregiver access to authorized profiles
- Role-based permissions

### 5. Storage Rules

Configure Storage security rules in Firebase Console:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Cloud Messaging Setup

1. Go to Project Settings > Cloud Messaging in Firebase Console
2. Generate a new Web Push certificate (VAPID key)
3. Add the VAPID key to your environment variables
4. The service worker at `public/firebase-messaging-sw.js` handles background notifications

## Usage Examples

### Authentication

```typescript
import { useAuthContext } from '@/contexts/auth-context';

function LoginComponent() {
  const { signInWithGoogle, signInWithEmail } = useAuthContext();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // User is now signed in
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return <button onClick={handleGoogleSignIn}>Sign in with Google</button>;
}
```

### Firestore Operations

```typescript
import { useFirestore } from '@/firebase';
import { getUser, createUserProfile } from '@/firebase/firestore/users';

async function createProfile() {
  const firestore = useFirestore();
  const userId = 'user123';
  
  const profileId = await createUserProfile(firestore, userId, {
    name: 'John Doe',
    ageCategory: 'elder',
    emergencyContacts: [],
    preferences: getDefaultPreferences(),
  });
}
```

### File Upload

```typescript
import { useStorage } from '@/firebase';
import { uploadFile, generateUserFilePath } from '@/firebase/storage';

async function uploadPrescription(file: File, userId: string) {
  const storage = useStorage();
  const path = generateUserFilePath(userId, 'prescriptions', file.name);
  
  const downloadURL = await uploadFile(storage, path, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
    }
  });
  
  return downloadURL;
}
```

### Push Notifications

```typescript
import { useMessaging, useFirestore } from '@/firebase';
import { requestNotificationPermission, saveFCMToken } from '@/firebase/messaging';

async function setupNotifications(userId: string) {
  const messaging = useMessaging();
  const firestore = useFirestore();
  
  const token = await requestNotificationPermission(messaging);
  
  if (token) {
    await saveFCMToken(userId, token, firestore);
  }
}
```

## Hooks

### useFirebase()
Access all Firebase services and user authentication state.

### useAuth()
Access Firebase Auth instance.

### useFirestore()
Access Firestore instance.

### useStorage()
Access Firebase Storage instance.

### useMessaging()
Access Firebase Cloud Messaging instance.

### useUser()
Access current authenticated user and loading state.

## Security Considerations

1. **Never commit** `.env.local` or any files containing Firebase credentials
2. **Always validate** user input before writing to Firestore
3. **Use security rules** to enforce data access policies
4. **Sanitize file uploads** to prevent malicious content
5. **Rate limit** authentication attempts to prevent abuse
6. **Enable App Check** for production to prevent unauthorized access

## Troubleshooting

### Authentication Issues
- Check that authentication providers are enabled in Firebase Console
- Verify authorized domains include your deployment domain
- Check browser console for CORS errors

### Firestore Permission Denied
- Verify security rules are deployed
- Check that user is authenticated
- Ensure user has permission to access the requested data

### Storage Upload Fails
- Check file size limits (default 10MB)
- Verify storage rules allow the upload
- Check file type validation

### Notifications Not Working
- Verify VAPID key is correct
- Check that service worker is registered
- Ensure notification permission is granted
- Check browser console for FCM errors

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Messaging Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Firebase Storage Security](https://firebase.google.com/docs/storage/security)
