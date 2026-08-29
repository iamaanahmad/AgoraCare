# Voice Integration Guide

This guide explains how to integrate and use the Agora voice interface in AgoraCare.

## Quick Start

### 1. Environment Setup

Add Agora credentials to your `.env.local`:

```bash
# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

### 2. Wrap Your App with VoiceProvider

In your root layout or app component:

```typescript
import { VoiceProvider } from '@/contexts/voice-context';

export default function RootLayout({ children }) {
  return (
    <VoiceProvider>
      {children}
    </VoiceProvider>
  );
}
```

### 3. Use Voice in Your Components

```typescript
import { useVoice } from '@/contexts/voice-context';
import { ChatInterface } from '@/components/voice/chat-interface';

function MyPage() {
  const { connect, isConnected } = useVoice();

  useEffect(() => {
    // Connect to voice channel
    connect('my-channel-name');
  }, []);

  return (
    <div>
      {isConnected && <ChatInterface />}
    </div>
  );
}
```

## Components

### ChatInterface

Dual-mode interface supporting voice and text input.

```typescript
import { ChatInterface } from '@/components/voice/chat-interface';

<ChatInterface
  className="h-[600px]"
  showVoiceControls={true}
  placeholder="Type or speak your message..."
/>
```

### VoiceControlPanel

Control panel for managing voice connection.

```typescript
import { VoiceControlPanel } from '@/components/voice/voice-control-panel';

<VoiceControlPanel
  defaultChannel="my-channel"
  className="w-full"
/>
```

### VoiceActivityIndicator

Visual indicator for voice activity.

```typescript
import { VoiceActivityIndicator } from '@/components/voice/voice-activity-indicator';

<VoiceActivityIndicator
  size="md"
  showLabel={true}
/>
```

## Voice Commands

### Medication Management

**Add Medication:**
```
User: "Add a new medication"
Assistant: "What's the name of the medication?"
User: "Aspirin"
Assistant: "What dosage should you take?"
User: "100mg"
Assistant: "How often should you take it?"
User: "Once daily"
Assistant: "Great! I've added Aspirin (100mg) to your schedule."
```

**Mark as Taken:**
```
User: "I took my medication"
Assistant: "Perfect! I've marked your medication as taken."
```

**Query Schedule:**
```
User: "What's my next dose?"
Assistant: "Your next dose is Aspirin (100mg) at 9:00 AM."
```

### Appointment Booking

```
User: "Book an appointment"
Assistant: "What symptoms are you experiencing?"
User: "I have a headache and fever"
Assistant: "What type of doctor would you like to see?"
User: "General practitioner"
Assistant: "When would you like to schedule the appointment?"
User: "Tomorrow at 2pm"
Assistant: "I'm booking your appointment now..."
```

### Emergency

```
User: "Emergency"
Assistant: "This is an emergency. Should I call your doctor or notify your family?"
User: "Call my doctor"
Assistant: "Initiating emergency protocol..."
```

## Medication Voice Integration

Use the `useVoiceMedication` hook for automatic medication command processing:

```typescript
import { useVoiceMedication } from '@/hooks/use-voice-medication';

function MedicationPage() {
  const { user } = useAuthContext();
  const { activeProfile } = useFamilyContext();

  const {
    processVoiceCommand,
    isInConversation,
    conversationProgress,
    resetConversation,
  } = useVoiceMedication({
    userId: user.uid,
    profileId: activeProfile.id,
    enabled: true,
  });

  // Voice commands are automatically processed
  // when messages are sent through the voice interface

  return (
    <div>
      <ChatInterface />
      
      {isInConversation && (
        <div>
          <p>Conversation in progress...</p>
          <progress 
            value={conversationProgress.current} 
            max={conversationProgress.total} 
          />
        </div>
      )}
    </div>
  );
}
```

## Custom Intent Handlers

Create custom handlers for your specific needs:

```typescript
import { createDefaultIntentRouter } from '@/lib/voice/intent-router';

const router = createDefaultIntentRouter();

// Register custom handler
router.registerHandler('custom_intent', async (intent, context) => {
  // Your custom logic here
  
  return {
    success: true,
    message: 'Custom action completed',
    data: { /* your data */ },
  };
});

// Use the router
const response = await router.route(intent, context);
```

## Voice-Enabled Medication Interface

Use the pre-built voice-enabled medication interface:

```typescript
import { VoiceMedicationInterface } from '@/components/medications/voice-medication-interface';

function MedicationPage() {
  const { user } = useAuthContext();
  const { activeProfile } = useFamilyContext();

  return (
    <VoiceMedicationInterface
      userId={user.uid}
      profileId={activeProfile.id}
    />
  );
}
```

## Advanced Usage

### Manual Voice Command Processing

```typescript
import { classifyIntent } from '@/lib/voice/intent-classifier';
import { createDefaultIntentRouter } from '@/lib/voice/intent-router';

const router = createDefaultIntentRouter();

async function processCommand(text: string) {
  // Classify the intent
  const intent = classifyIntent(text);
  
  // Route to handler
  const response = await router.route(intent, {
    firestore,
    userId,
    profileId,
  });
  
  console.log(response.message);
}
```

### Custom Conversation Flows

```typescript
import { ConversationManager, CONVERSATION_FLOWS } from '@/lib/voice/conversation-manager';

// Add custom flow
CONVERSATION_FLOWS.custom_flow = {
  intent: 'custom_flow',
  steps: [
    {
      id: 'step1',
      prompt: 'What is your question?',
      field: 'question',
      validation: (value) => value.length > 0,
    },
  ],
};

// Use the flow
const manager = new ConversationManager();
const prompt = manager.startFlow(intent);
```

## Troubleshooting

### Voice Not Connecting

1. Check Agora App ID is correct
2. Verify environment variables are loaded
3. Check browser microphone permissions
4. Ensure HTTPS in production

### Commands Not Recognized

1. Check intent patterns in `intent-classifier.ts`
2. Add more pattern variations
3. Verify entity extraction patterns
4. Check confidence threshold

### Conversation Not Progressing

1. Verify conversation flow is defined
2. Check step validation functions
3. Review conversation state
4. Check for errors in console

## Best Practices

1. **Always provide feedback**: Let users know their command was received
2. **Handle errors gracefully**: Provide helpful error messages
3. **Confirm destructive actions**: Ask for confirmation before deleting
4. **Support both voice and text**: Not all users can use voice
5. **Keep conversations short**: Minimize steps in conversation flows
6. **Provide examples**: Show users what commands they can use
7. **Test with real users**: Especially elderly users for accessibility

## Production Checklist

- [ ] Install `agora-access-token` package
- [ ] Implement proper token generation in `/api/agora/token`
- [ ] Set all environment variables
- [ ] Enable HTTPS
- [ ] Test token renewal
- [ ] Test reconnection logic
- [ ] Add error monitoring
- [ ] Test with various accents and speech patterns
- [ ] Verify microphone permissions handling
- [ ] Test offline behavior

## Resources

- [Agora Documentation](https://docs.agora.io/)
- [Voice Interface Design](https://developers.google.com/assistant/conversation-design)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
