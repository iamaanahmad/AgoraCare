# Notification and Reminder System

This directory contains the complete notification and reminder system for AgoraCare, implementing medication reminders, missed medication detection, and in-app notification display with voice announcements.

## Features

### 1. Firebase Cloud Messaging (FCM) Integration
- Push notifications for background and foreground messages
- Service worker for background notification handling
- FCM token management and storage
- Browser notification permission handling

### 2. Medication Reminder Scheduling
- Automatic scheduling of medication reminders based on medication schedules
- Support for daily, alternate day, weekly, and as-needed frequencies
- Configurable scheduling window (default: 7 days ahead)
- Notification delivery within 30 seconds of scheduled time

### 3. Missed Medication Detection
- Automatic detection of missed medications (15-minute delay)
- Follow-up notifications for missed doses
- Adherence record checking to avoid duplicate notifications
- Intelligent notification suppression for already-taken medications

### 4. In-App Notification Display
- Real-time notification list with unread indicators
- Notification bell with unread count badge
- Click-to-navigate functionality
- Mark as read / Mark all as read actions
- Notification type icons and priority indicators

### 5. Voice Announcements
- Text-to-speech for notification content
- Configurable voice announcement preferences
- Automatic announcement for high-priority notifications
- Browser speech synthesis API integration

### 6. Notification Preferences
- Enable/disable notifications globally
- Sound, vibration, and voice announcement toggles
- Notification type filtering (medication, appointment, emergency)
- Quiet hours configuration
- Per-profile preference storage

## Components

### NotificationBell
Location: `src/components/notifications/notification-bell.tsx`

Displays a bell icon with unread count badge. Opens a popover with the notification list.

```tsx
import { NotificationBell } from '@/components/notifications';

<NotificationBell />
```

### NotificationList
Location: `src/components/notifications/notification-list.tsx`

Displays a scrollable list of notifications with type icons, timestamps, and read status.

```tsx
import { NotificationList } from '@/components/notifications';

<NotificationList onClose={() => console.log('closed')} />
```

### NotificationPreferences
Location: `src/components/notifications/notification-preferences.tsx`

Comprehensive notification settings interface with all preference options.

```tsx
import { NotificationPreferences } from '@/components/notifications';

<NotificationPreferences />
```

## Hooks

### useNotifications
Location: `src/contexts/notification-context.tsx`

Main hook for accessing notification state and actions.

```tsx
const {
  notifications,
  unreadCount,
  preferences,
  isLoading,
  permissionStatus,
  requestPermission,
  markAsRead,
  markAllAsRead,
  updatePreferences,
  refresh,
  playNotificationSound,
  announceNotification,
} = useNotifications();
```

### useMedicationReminders
Location: `src/hooks/use-medication-reminders.ts`

Hook for managing medication reminder scheduling.

```tsx
const {
  scheduleReminders,
  scheduleAllReminders,
  rescheduleReminders,
  checkMissed,
  isScheduling,
  error,
} = useMedicationReminders();

// Schedule reminders for a medication
await scheduleReminders(medication, 7);

// Schedule all reminders
await scheduleAllReminders(7);

// Reschedule after medication update
await rescheduleReminders(medication);

// Check for missed medications
await checkMissed();
```

## Services

### NotificationScheduler
Location: `src/lib/notification-scheduler.ts`

Background service that processes pending notifications every 30 seconds.

```tsx
import { NotificationScheduler } from '@/lib/notification-scheduler';

const scheduler = new NotificationScheduler(firestore, sendNotificationFn);
scheduler.start();

// Later...
scheduler.stop();
```

### Notification Functions
Location: `src/firebase/firestore/notifications.ts`

Firestore operations for notification management:
- `createNotification` - Create a new notification
- `getUserNotifications` - Get notifications for a user
- `getPendingNotifications` - Get scheduled notifications
- `markNotificationAsRead` - Mark as read
- `updateNotificationPreferences` - Update preferences
- `shouldSendNotification` - Check if notification should be sent

### Scheduling Functions
Location: `src/lib/notification-scheduler.ts`

Medication reminder scheduling:
- `scheduleMedicationReminders` - Schedule reminders for a medication
- `scheduleAllMedicationReminders` - Schedule for all active medications
- `rescheduleMedicationReminders` - Reschedule after updates
- `checkMissedMedications` - Detect and notify missed doses
- `processPendingNotifications` - Process and send pending notifications

## Data Models

### NotificationData
```typescript
interface NotificationData {
  id: string;
  userId: string;
  profileId: string;
  type: 'medication-reminder' | 'medication-missed' | 'appointment-reminder' | 'emergency' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requireInteraction: boolean;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### NotificationPreferences
```typescript
interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  voiceAnnouncement: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  emergencyAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
}
```

## Usage Examples

### 1. Enable Notifications
```tsx
import { useNotifications } from '@/contexts/notification-context';

function MyComponent() {
  const { permissionStatus, requestPermission } = useNotifications();

  const handleEnable = async () => {
    if (permissionStatus !== 'granted') {
      await requestPermission();
    }
  };

  return <button onClick={handleEnable}>Enable Notifications</button>;
}
```

### 2. Schedule Medication Reminders
```tsx
import { useMedicationReminders } from '@/hooks/use-medication-reminders';

function MedicationForm() {
  const { scheduleReminders } = useMedicationReminders();

  const handleSubmit = async (medication) => {
    // Save medication...
    
    // Schedule reminders
    const count = await scheduleReminders(medication, 7);
    console.log(`Scheduled ${count} reminders`);
  };
}
```

### 3. Display Notifications
```tsx
import { NotificationBell } from '@/components/notifications';

function Header() {
  return (
    <header>
      <h1>AgoraCare</h1>
      <NotificationBell />
    </header>
  );
}
```

### 4. Update Preferences
```tsx
import { useNotifications } from '@/contexts/notification-context';

function Settings() {
  const { preferences, updatePreferences } = useNotifications();

  const handleToggleSound = async () => {
    await updatePreferences({ sound: !preferences.sound });
  };

  return (
    <button onClick={handleToggleSound}>
      Sound: {preferences.sound ? 'On' : 'Off'}
    </button>
  );
}
```

## Firestore Structure

```
notifications/
  {notificationId}/
    - userId: string
    - profileId: string
    - type: string
    - title: string
    - body: string
    - data: object
    - scheduledFor: timestamp
    - sentAt: timestamp
    - status: string
    - priority: string
    - requireInteraction: boolean
    - read: boolean
    - actionUrl: string
    - createdAt: timestamp
    - updatedAt: timestamp

users/
  {userId}/
    profiles/
      {profileId}/
        settings/
          notifications/
            - enabled: boolean
            - sound: boolean
            - vibration: boolean
            - voiceAnnouncement: boolean
            - medicationReminders: boolean
            - appointmentReminders: boolean
            - emergencyAlerts: boolean
            - quietHoursEnabled: boolean
            - quietHoursStart: string
            - quietHoursEnd: string
```

## Requirements Addressed

This implementation addresses the following requirements from the spec:

- **Requirement 2.1**: Voice notifications through Conversational AI Module
- **Requirement 2.5**: Follow-up notifications for missed medications (15-minute delay)
- **Requirement 9.1**: Push notification delivery within 30 seconds
- **Requirement 9.2**: Appointment reminders at 24 hours and 1 hour before
- **Requirement 9.3**: In-app notifications with voice announcements
- **Requirement 9.4**: Customizable notification preferences
- **Requirement 9.5**: Notification interaction recording

## Testing

To test the notification system:

1. **Enable Notifications**: Click the notification bell and enable permissions
2. **Add Medication**: Create a medication with a schedule
3. **Wait for Reminder**: Notification should appear within 30 seconds of scheduled time
4. **Miss Medication**: Don't mark as taken, wait 15 minutes for follow-up
5. **Test Preferences**: Toggle sound, voice, and quiet hours settings
6. **Test Voice**: Enable voice announcements and receive a notification

## Notes

- Notifications require browser permission (granted via user interaction)
- Background notifications work via service worker
- Voice announcements use browser Speech Synthesis API
- Notification sound is a placeholder (replace with actual MP3)
- Quiet hours respect user timezone
- Emergency alerts always bypass quiet hours
