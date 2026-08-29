# Voice Processing System

This directory contains the voice processing and intent recognition system for AgoraCare's conversational interface.

## Overview

The voice processing system enables natural language interaction with the application, allowing users to manage medications, book appointments, and handle emergencies using voice or text commands.

## Architecture

```
User Input (Voice/Text)
    ↓
Intent Classifier
    ↓
Intent Router
    ↓
Conversation Manager (if multi-turn)
    ↓
Intent Handlers (Medication, Appointment, Emergency)
    ↓
Action Execution
    ↓
Response to User
```

## Components

### 1. Intent Classifier (`intent-classifier.ts`)

Classifies user input into actionable intents using pattern matching.

**Supported Intents:**
- `medication_add` - Add a new medication
- `medication_taken` - Mark medication as taken
- `medication_query` - Query medication schedule
- `appointment_book` - Book an appointment
- `appointment_query` - Query appointments
- `emergency` - Trigger emergency protocol
- `general_query` - General help queries
- `unknown` - Unrecognized input

**Entity Extraction:**
Automatically extracts entities from user input:
- Medication names
- Dosages (e.g., "10mg", "2 tablets")
- Frequencies (e.g., "twice daily", "every 6 hours")
- Timing (e.g., "after meals", "at 9am")
- Symptoms
- Specializations

**Usage:**
```typescript
import { classifyIntent } from '@/lib/voice/intent-classifier';

const intent = classifyIntent("I need to add a new medication");
// Returns:
// {
//   type: 'medication_add',
//   confidence: 0.85,
//   entities: {},
//   rawText: "I need to add a new medication",
//   action: 'add_medication'
// }
```

### 2. Conversation Manager (`conversation-manager.ts`)

Manages multi-turn conversations for complex intents that require multiple pieces of information.

**Features:**
- Step-by-step data collection
- Field validation
- Optional steps
- Progress tracking
- Context preservation

**Conversation Flows:**

**Add Medication Flow:**
1. Medication name
2. Dosage
3. Frequency
4. Timing (optional)

**Book Appointment Flow:**
1. Symptoms
2. Specialization (optional, can be inferred)
3. Preferred date

**Emergency Flow:**
1. Confirmation of action (call doctor/notify family)

**Usage:**
```typescript
import { ConversationManager } from '@/lib/voice/conversation-manager';

const manager = new ConversationManager();

// Start a conversation
const prompt = manager.startFlow(intent, profileId);
// Returns: "What's the name of the medication?"

// Process user response
const nextPrompt = manager.processResponse("Aspirin");
// Returns: "What dosage should you take?"

// Check if complete
if (manager.isComplete()) {
  const data = manager.getCollectedData();
  // { medicationName: "Aspirin", dosage: "100mg", ... }
}
```

### 3. Intent Router (`intent-router.ts`)

Routes classified intents to appropriate handlers and manages conversation state.

**Features:**
- Handler registration
- Conversation state management
- Fallback handling
- Context passing
- Progress tracking

**Usage:**
```typescript
import { createDefaultIntentRouter } from '@/lib/voice/intent-router';

const router = createDefaultIntentRouter();

// Register custom handler
router.registerHandler('medication_add', async (intent, context) => {
  // Handle medication addition
  return {
    success: true,
    message: "Medication added successfully",
    requiresConversation: false,
  };
});

// Route an intent
const response = await router.route(intent, context);
```

### 4. Medication Voice Handlers (`medication-voice-handlers.ts`)

Specialized handlers for medication-related voice commands.

**Handlers:**
- `handleAddMedication` - Adds a new medication to the schedule
- `handleMarkMedicationTaken` - Records medication adherence
- `handleMedicationQuery` - Retrieves medication information

**Features:**
- Automatic medication name matching
- Next dose detection
- Natural language parsing
- Firestore integration

**Usage:**
```typescript
import { createMedicationVoiceHandlers } from '@/lib/voice/medication-voice-handlers';

const handlers = createMedicationVoiceHandlers({
  firestore,
  userId,
  profileId,
});

const response = await handlers.handleAddMedication(intent);
```

## Voice Commands

### Medication Commands

**Add Medication:**
- "Add a new medication"
- "I need to add medicine"
- "Start taking [medication name]"

**Mark as Taken:**
- "I took my medication"
- "Mark as taken"
- "I finished my [medication name]"

**Query Schedule:**
- "What's my next dose?"
- "Show my medications"
- "When should I take my medicine?"

### Appointment Commands

**Book Appointment:**
- "Book an appointment"
- "I need to see a doctor"
- "Schedule an appointment"

**Query Appointments:**
- "When is my next appointment?"
- "Show my appointments"
- "Do I have any appointments?"

### Emergency Commands

**Trigger Emergency:**
- "Emergency"
- "Call my doctor"
- "I need help"

## Integration with React

### Voice Context Provider

Wrap your app with the VoiceProvider:

```typescript
import { VoiceProvider } from '@/contexts/voice-context';

function App() {
  return (
    <VoiceProvider>
      {/* Your app */}
    </VoiceProvider>
  );
}
```

### Use Voice Hook

Access voice functionality in components:

```typescript
import { useVoice } from '@/contexts/voice-context';

function MyComponent() {
  const { 
    connect, 
    disconnect, 
    sendMessage,
    voiceState,
    messages 
  } = useVoice();

  // Connect to voice channel
  await connect('my-channel');

  // Send a message
  await sendMessage("What's my next dose?");
}
```

### Voice-Enabled Medication Hook

Use the integrated medication voice hook:

```typescript
import { useVoiceMedication } from '@/hooks/use-voice-medication';

function MedicationPage() {
  const { 
    processVoiceCommand,
    isInConversation,
    conversationProgress 
  } = useVoiceMedication({
    userId,
    profileId,
    enabled: true,
  });

  // Process a voice command
  const response = await processVoiceCommand("Add medication");
}
```

## Extending the System

### Adding New Intents

1. **Define Intent Type:**
```typescript
// In intent-classifier.ts
export type IntentType = 
  | 'medication_add'
  | 'your_new_intent'; // Add here
```

2. **Add Intent Patterns:**
```typescript
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  your_new_intent: [
    /pattern1/i,
    /pattern2/i,
  ],
};
```

3. **Create Conversation Flow:**
```typescript
// In conversation-manager.ts
export const CONVERSATION_FLOWS: Record<IntentType, ConversationFlow> = {
  your_new_intent: {
    intent: 'your_new_intent',
    steps: [
      {
        id: 'step1',
        prompt: 'What information do you need?',
        field: 'fieldName',
      },
    ],
  },
};
```

4. **Register Handler:**
```typescript
// In intent-router.ts
router.registerHandler('your_new_intent', async (intent) => {
  // Handle the intent
  return {
    success: true,
    message: 'Intent handled',
  };
});
```

### Adding New Entity Types

Add patterns to `ENTITY_PATTERNS` in `intent-classifier.ts`:

```typescript
const ENTITY_PATTERNS = {
  yourEntity: /pattern to match/i,
};
```

## Testing

### Unit Testing Intent Classification

```typescript
import { classifyIntent } from '@/lib/voice/intent-classifier';

test('classifies medication add intent', () => {
  const intent = classifyIntent('add a new medication');
  expect(intent.type).toBe('medication_add');
  expect(intent.confidence).toBeGreaterThan(0.6);
});
```

### Testing Conversation Flows

```typescript
import { ConversationManager } from '@/lib/voice/conversation-manager';

test('completes medication add conversation', () => {
  const manager = new ConversationManager();
  
  manager.startFlow(intent);
  manager.processResponse('Aspirin');
  manager.processResponse('100mg');
  manager.processResponse('once daily');
  
  expect(manager.isComplete()).toBe(true);
  expect(manager.getCollectedData()).toEqual({
    medicationName: 'Aspirin',
    dosage: '100mg',
    frequency: 'once daily',
  });
});
```

## Performance Considerations

1. **Intent Classification**: O(n) where n is number of patterns. Consider caching for repeated queries.

2. **Entity Extraction**: Runs all patterns on every input. Optimize by short-circuiting when entities are found.

3. **Conversation State**: Stored in memory. For production, consider persisting to database for multi-device support.

## Future Enhancements

1. **Machine Learning**: Replace pattern matching with ML-based intent classification
2. **Context Awareness**: Remember previous conversations for better understanding
3. **Multi-Language**: Support multiple languages
4. **Voice Biometrics**: User identification through voice
5. **Sentiment Analysis**: Detect urgency and emotion in voice
6. **Proactive Suggestions**: Suggest actions based on patterns

## Troubleshooting

### Intent Not Recognized
- Check if pattern exists in `INTENT_PATTERNS`
- Verify pattern regex is correct
- Add more pattern variations
- Check confidence threshold

### Conversation Not Progressing
- Verify conversation flow is defined
- Check step validation functions
- Ensure responses match expected format
- Review conversation state

### Entities Not Extracted
- Check entity pattern regex
- Verify entity name matches pattern key
- Test pattern with sample inputs
- Add more pattern variations

## Resources

- [Natural Language Processing Basics](https://en.wikipedia.org/wiki/Natural_language_processing)
- [Intent Recognition Patterns](https://rasa.com/docs/rasa/nlu-training-data/)
- [Conversation Design](https://developers.google.com/assistant/conversation-design)
