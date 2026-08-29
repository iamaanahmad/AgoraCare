# Medication Management System

This directory contains the complete medication management implementation for AgoraCare, including data models, scheduling logic, UI components, and adherence tracking.

## Files Created

### Data Layer
- **`src/firebase/firestore/medications.ts`** - Firestore CRUD operations for medications and adherence records
  - Type definitions for Medication, MedicationFrequency, MedicationTiming, AdherenceRecord
  - Validation functions for data integrity
  - Complete CRUD operations for medications and adherence records
  - Support for querying active medications and adherence history

### Business Logic
- **`src/lib/medication-scheduler.ts`** - Natural language parsing and schedule generation
  - Parse timing instructions like "twice daily", "after meals", "alternate days"
  - Generate scheduled doses based on frequency and timing
  - Calculate next doses and today's schedule
  - Format schedules for display

- **`src/lib/adherence-calculator.ts`** - Adherence statistics and analytics
  - Calculate overall and per-medication adherence rates
  - Track adherence trends (improving/stable/declining)
  - Generate daily adherence trends for visualization
  - Calculate streaks and identify missed doses
  - Provide adherence ratings and recommendations

### UI Components
- **`src/components/medications/medication-form.tsx`** - Add/edit medication form
  - Conversational input with real-time parsing
  - Natural language schedule instructions
  - Date pickers for start/end dates
  - Visual feedback showing parsed schedule

- **`src/components/medications/medication-list.tsx`** - List view of all medications
  - Card-based layout with medication details
  - Adherence rate indicators
  - Quick actions (edit, delete, mark as taken)
  - Today's schedule display per medication

- **`src/components/medications/medication-scheduler.tsx`** - Timeline view of today's schedule
  - Timeline and list view modes
  - Visual status indicators (taken/missed/skipped/upcoming)
  - Quick action buttons for marking doses
  - Grouped by status (upcoming, completed, missed)

- **`src/components/medications/adherence-stats.tsx`** - Statistics and analytics dashboard
  - Overall adherence rate with progress bar
  - Trend indicators (improving/stable/declining)
  - Current streak display
  - Per-medication breakdown
  - Daily trend visualization
  - Period comparison (today/week/month)

### Hooks
- **`src/hooks/use-medications.ts`** - React hook for medication management
  - Load medications and adherence records
  - Add, edit, delete medications
  - Mark doses as taken, missed, or skipped
  - Automatic parsing of natural language instructions
  - Error handling and loading states

### Pages
- **`src/app/medications/page.tsx`** - Main medications page
  - Tabbed interface (Schedule, List, Statistics)
  - Add/edit medication dialog
  - Delete confirmation dialog
  - Toast notifications for actions
  - Integration with family context for multi-profile support

## Features Implemented

### Natural Language Processing
- Parse timing instructions like:
  - "twice daily" → 8:00 AM and 8:00 PM
  - "three times daily" → 8:00 AM, 2:00 PM, 8:00 PM
  - "after meals" → adds meal relation to timing
  - "alternate days" → every 2 days frequency
  - "Monday, Wednesday, Friday" → weekly on specific days
  - "8am and 6pm" → specific times

### Schedule Generation
- Generate scheduled doses for any date range
- Support for multiple frequency types:
  - Daily
  - Alternate days (every N days)
  - Weekly (specific days of week)
  - As-needed (no scheduled doses)
- Multiple times per day support
- Meal relation support (before/after/with meals, bedtime)

### Adherence Tracking
- Record adherence status (taken/missed/skipped)
- Track method (manual/voice/auto)
- Calculate adherence rates:
  - Overall rate
  - Per-medication rates
  - Period-based rates (today/week/month)
- Trend analysis (improving/stable/declining)
- Streak calculation
- Missed dose identification

### UI/UX Features
- Card-based layouts with clear visual hierarchy
- Color-coded status indicators
- Timeline view with visual progress
- Real-time schedule parsing feedback
- Responsive design for mobile and desktop
- Accessible components with proper ARIA labels
- Loading states and error handling
- Toast notifications for user feedback

## Usage Example

```typescript
import { useMedications } from '@/hooks/use-medications';

function MyComponent() {
  const {
    medications,
    adherenceRecords,
    isLoading,
    addMedication,
    markAsTaken,
  } = useMedications(userId, profileId);

  const handleAdd = async () => {
    await addMedication({
      name: 'Aspirin',
      dosage: '100mg',
      instructions: 'twice daily after meals',
      startDate: new Date(),
    });
  };

  const handleMarkTaken = async (medicationId: string) => {
    await markAsTaken(medicationId, new Date());
  };

  return (
    <MedicationList
      medications={medications}
      onMarkTaken={(med) => handleMarkTaken(med.id)}
    />
  );
}
```

## Data Models

### Medication
```typescript
interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  timing: MedicationTiming[];
  startDate: Date;
  endDate?: Date;
  instructions: string;
  prescriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AdherenceRecord
```typescript
interface AdherenceRecord {
  id: string;
  medicationId: string;
  profileId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'taken' | 'missed' | 'skipped';
  method: 'manual' | 'voice' | 'auto';
  notes?: string;
  createdAt: Date;
}
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.1**: Voice notifications for medication times (infrastructure ready)
- **Requirement 2.2**: Conversational flow for adding medications
- **Requirement 2.3**: Natural language timing interpretation
- **Requirement 2.4**: Adherence status recording with timestamp
- **Requirement 2.5**: Follow-up notifications for missed medications (infrastructure ready)

## Next Steps

To complete the medication management system:

1. Integrate Agora Conversational AI SDK for voice commands
2. Implement Firebase Cloud Messaging for push notifications
3. Add notification scheduling service
4. Implement voice-triggered adherence recording
5. Add medication reminder notifications
6. Integrate with prescription scanning (OCR) for auto-population
