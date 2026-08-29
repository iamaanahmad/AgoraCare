# Emergency Assistance System

Complete emergency assistance system for AgoraCare with voice triggers, emergency calls, and multi-channel notifications.

## Features

### 1. Emergency Contact Management
- Add, edit, and delete emergency contacts
- Priority-based contact ordering
- Notification preferences (Call, SMS, or Both)
- Contact validation and formatting

### 2. Voice Trigger Detection
- Real-time keyword detection for emergency phrases
- Multiple trigger patterns:
  - Critical: "emergency", "911", "can't breathe", "chest pain"
  - High: "call doctor", "urgent", "need help"
  - Medium: "help", "assistance"
- Confidence-based activation
- Continuous monitoring during voice sessions

### 3. Emergency UI Components
- **EmergencyPanel**: Full-screen emergency interface with large buttons
- **EmergencyButton**: Quick access emergency button (multiple variants)
- **EmergencyStatusIndicator**: Real-time status display
- **EmergencyCallInterface**: In-call interface with controls
- Visual and audio feedback for emergency activation

### 4. Agora RTC Emergency Calls
- Voice call initiation to emergency contacts
- Call state management (initiating, ringing, connected, ended)
- Mute/unmute functionality
- Call duration tracking
- Call quality monitoring
- Optional call recording with consent

### 5. Multi-Channel Notifications
- **SMS Notifications** via Twilio
  - Formatted emergency messages
  - Phone number validation and formatting
  - Bulk SMS support
- **Push Notifications** via Firebase Cloud Messaging
  - High-priority emergency alerts
  - Custom notification sounds
  - Rich notification content
- Notification delivery tracking
- Follow-up notifications

### 6. Emergency Event Logging
- Complete event history in Firestore
- Event metadata:
  - Trigger type (voice, button, auto)
  - Emergency type (call-doctor, notify-family, emergency-services)
  - Status tracking
  - Contacts notified
  - Call duration
  - Location data
- Event statistics and analytics

## Components

### EmergencyPanel
Full-screen emergency interface with large, accessible action buttons.

```tsx
import { EmergencyPanel } from '@/components/emergency/emergency-panel';

<EmergencyPanel
  isActive={isEmergencyActive}
  onClose={() => setIsEmergencyActive(false)}
  onCallDoctor={handleCallDoctor}
  onNotifyFamily={handleNotifyFamily}
  emergencyContacts={contacts}
  triggerKeyword="emergency"
/>
```

### EmergencyButton Variants

```tsx
import { 
  EmergencyButton, 
  EmergencyButtonLarge, 
  EmergencyButtonFloating 
} from '@/components/emergency/emergency-button';

// Standard button
<EmergencyButton onClick={activateEmergency} />

// Large button for dashboard
<EmergencyButtonLarge onClick={activateEmergency} />

// Floating button (always visible)
<EmergencyButtonFloating onClick={activateEmergency} />
```

### EmergencyCallInterface
In-call interface with mute and end call controls.

```tsx
import { EmergencyCallInterface } from '@/components/emergency/emergency-call-interface';

<EmergencyCallInterface
  callState={callState}
  contact={currentContact}
  duration={formattedDuration}
  isMuted={isMuted}
  onEndCall={endCall}
  onToggleMute={toggleMute}
/>
```

### EmergencyContactManager
Complete contact management interface.

```tsx
import { EmergencyContactManager } from '@/components/emergency/emergency-contact-manager';

<EmergencyContactManager
  userId={userId}
  profileId={profileId}
/>
```

## Hooks

### useEmergencyDetection
Monitor voice/text input for emergency keywords.

```tsx
import { useEmergencyDetection } from '@/hooks/use-emergency-detection';

const {
  isMonitoring,
  lastTrigger,
  isEmergencyActive,
  startMonitoring,
  stopMonitoring,
  processText,
  checkForEmergency,
  clearEmergency,
} = useEmergencyDetection();

// Start monitoring
startMonitoring((trigger) => {
  console.log('Emergency detected:', trigger);
  activateEmergency();
});

// Process voice transcription
processText(transcribedText);

// Manual check
const trigger = checkForEmergency(userInput);
```

### useEmergencyCall
Manage emergency voice calls.

```tsx
import { useEmergencyCall } from '@/hooks/use-emergency-call';

const {
  callState,
  callDuration,
  formattedDuration,
  isMuted,
  currentContact,
  initiateCall,
  endCall,
  toggleMute,
  isCallActive,
} = useEmergencyCall();

// Initiate call
await initiateCall(emergencyContact, true); // true = record call

// End call
await endCall();

// Toggle mute
await toggleMute();
```

### useEmergencyNotifications
Send SMS and push notifications to emergency contacts.

```tsx
import { useEmergencyNotifications } from '@/hooks/use-emergency-notifications';

const {
  isNotifying,
  notificationResults,
  notifyContacts,
  sendFollowUp,
  testNotification,
  getSuccessRate,
} = useEmergencyNotifications(userId);

// Notify all contacts
const { eventId, results } = await notifyContacts(contacts, {
  patientName: 'John Doe',
  profileId: 'profile123',
  emergencyType: 'notify-family',
  triggerKeyword: 'emergency',
  location: 'Home',
});

// Send follow-up
await sendFollowUp(contacts, {
  patientName: 'John Doe',
  profileId: 'profile123',
  emergencyType: 'notify-family',
  status: 'resolved',
  updateMessage: 'Emergency resolved. Patient is safe.',
});
```

### useEmergencyContacts
Manage emergency contacts for a profile.

```tsx
import { useEmergencyContacts } from '@/hooks/use-emergency-contacts';

const {
  contacts,
  isLoading,
  addContact,
  updateContact,
  deleteContact,
  reorderContacts,
} = useEmergencyContacts(userId, profileId);

// Add contact
await addContact({
  name: 'Dr. Smith',
  relationship: 'Primary Doctor',
  phoneNumber: '+1234567890',
  email: 'dr.smith@example.com',
  priority: 1,
  notificationPreference: 'both',
});
```

## Context

### EmergencyContext
Global emergency state management.

```tsx
import { useEmergency } from '@/contexts/emergency-context';

const {
  isEmergencyActive,
  currentEvent,
  emergencyStatus,
  activateEmergency,
  deactivateEmergency,
  callDoctor,
  notifyFamily,
  updateEventStatus,
} = useEmergency();

// Activate emergency
activateEmergency(trigger, 'voice');

// Call doctor
await callDoctor(profileId, emergencyContacts);

// Notify family
await notifyFamily(profileId, emergencyContacts);

// Deactivate
deactivateEmergency();
```

## Services

### EmergencyDetector
Low-level emergency keyword detection.

```tsx
import { 
  detectEmergency, 
  shouldActivateEmergency,
  getEmergencyAction,
  EmergencyMonitor 
} from '@/lib/emergency/emergency-detector';

// Detect emergency in text
const trigger = detectEmergency('I need help, emergency!');

// Check if should activate
if (shouldActivateEmergency(trigger)) {
  const action = getEmergencyAction(trigger);
  console.log(action.message); // "Emergency detected. Activating emergency services."
}

// Continuous monitoring
const monitor = new EmergencyMonitor();
monitor.start((trigger) => {
  console.log('Emergency detected:', trigger);
});
monitor.process(transcribedText);
```

### EmergencyCallService
Agora RTC call management.

```tsx
import { EmergencyCallService } from '@/lib/emergency/emergency-call-service';

const callService = new EmergencyCallService();

// Set up event listeners
callService.on('stateChange', (state) => {
  console.log('Call state:', state);
});

callService.on('durationUpdate', (duration) => {
  console.log('Duration:', duration);
});

// Initiate call
await callService.initiateCall({
  appId: 'your-agora-app-id',
  channel: 'emergency-channel',
  token: 'agora-token',
  uid: 12345,
  contactName: 'Dr. Smith',
  contactPhone: '+1234567890',
  recordCall: true,
});

// End call
await callService.endCall();
```

### EmergencyNotificationService
Multi-channel notification delivery.

```tsx
import { getEmergencyNotificationService } from '@/lib/emergency/emergency-notification-service';

const service = getEmergencyNotificationService();

// Notify all contacts
const results = await service.notifyAllContacts(contacts, {
  patientName: 'John Doe',
  profileId: 'profile123',
  emergencyType: 'notify-family',
  triggerKeyword: 'emergency',
  location: 'Home',
});

// Send follow-up
await service.sendFollowUp(contacts, {
  patientName: 'John Doe',
  profileId: 'profile123',
  emergencyType: 'notify-family',
  status: 'resolved',
  updateMessage: 'Patient is safe.',
});
```

## Environment Variables

Required environment variables for emergency features:

```env
# Agora (for emergency calls)
NEXT_PUBLIC_AGORA_APP_ID=your-agora-app-id

# Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Admin (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

## Integration Example

Complete emergency system integration:

```tsx
'use client';

import { useState } from 'react';
import { EmergencyProvider, useEmergency } from '@/contexts/emergency-context';
import { EmergencyPanel } from '@/components/emergency/emergency-panel';
import { EmergencyButtonFloating } from '@/components/emergency/emergency-button';
import { EmergencyCallInterface } from '@/components/emergency/emergency-call-interface';
import { useEmergencyDetection } from '@/hooks/use-emergency-detection';
import { useEmergencyCall } from '@/hooks/use-emergency-call';
import { useEmergencyContacts } from '@/hooks/use-emergency-contacts';
import { useEmergencyNotifications } from '@/hooks/use-emergency-notifications';

function EmergencySystem({ userId, profileId }) {
  const { isEmergencyActive, activateEmergency, deactivateEmergency } = useEmergency();
  const { contacts } = useEmergencyContacts(userId, profileId);
  const { notifyContacts } = useEmergencyNotifications(userId);
  const { 
    callState, 
    formattedDuration, 
    isMuted, 
    currentContact,
    initiateCall, 
    endCall, 
    toggleMute 
  } = useEmergencyCall();
  
  const { startMonitoring, processText } = useEmergencyDetection();

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring((trigger) => {
      activateEmergency(trigger, 'voice');
    });
  }, []);

  const handleCallDoctor = async () => {
    const primaryContact = contacts.find(c => c.priority === 1);
    if (primaryContact) {
      await initiateCall(primaryContact, true);
    }
  };

  const handleNotifyFamily = async () => {
    await notifyContacts(contacts, {
      patientName: 'John Doe',
      profileId,
      emergencyType: 'notify-family',
    });
  };

  return (
    <>
      <EmergencyButtonFloating onClick={() => activateEmergency()} />
      
      <EmergencyPanel
        isActive={isEmergencyActive}
        onClose={deactivateEmergency}
        onCallDoctor={handleCallDoctor}
        onNotifyFamily={handleNotifyFamily}
        emergencyContacts={contacts}
      />

      <EmergencyCallInterface
        callState={callState}
        contact={currentContact}
        duration={formattedDuration}
        isMuted={isMuted}
        onEndCall={endCall}
        onToggleMute={toggleMute}
      />
    </>
  );
}

// Wrap with provider
export default function App() {
  return (
    <EmergencyProvider>
      <EmergencySystem userId="user123" profileId="profile456" />
    </EmergencyProvider>
  );
}
```

## Testing

### Test Emergency Detection
```tsx
import { detectEmergency } from '@/lib/emergency/emergency-detector';

const testCases = [
  'emergency',
  'call doctor',
  'I need help',
  'chest pain',
  'can\'t breathe',
];

testCases.forEach(text => {
  const trigger = detectEmergency(text);
  console.log(`"${text}":`, trigger);
});
```

### Test Notifications
```tsx
const { testNotification } = useEmergencyNotifications(userId);

const result = await testNotification({
  id: 'test',
  name: 'Test Contact',
  relationship: 'Test',
  phoneNumber: '+1234567890',
  priority: 1,
  notificationPreference: 'both',
});

console.log('Test result:', result);
```

## Requirements Covered

- ✅ 5.1: Voice trigger detection for "emergency" and "call doctor"
- ✅ 5.2: Large, accessible action buttons in emergency panel
- ✅ 5.3: Agora RTC integration for emergency calls
- ✅ 5.4: SMS and push notifications to emergency contacts
- ✅ 5.5: Emergency event logging with timestamp and actions

## Next Steps

1. Add location services integration
2. Implement emergency services (911) direct dial
3. Add video call support for emergencies
4. Implement emergency contact verification
5. Add emergency drill/test mode
6. Create emergency response analytics dashboard
