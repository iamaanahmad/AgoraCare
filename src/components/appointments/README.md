# Appointments Components

This directory contains all components related to appointment booking and management in AgoraCare.

## Components

### AppointmentBooking
Main orchestrator component that handles the multi-step appointment booking flow.

**Features:**
- Two-step booking process (symptom intake → appointment form)
- Progress indicator
- Integration with Genkit AI for symptom analysis

**Usage:**
```tsx
<AppointmentBooking
  userId={user.uid}
  profileId={profile.id}
  patientName={profile.name}
  patientAgeCategory={profile.ageCategory}
  onComplete={() => console.log('Booking complete')}
/>
```

### SymptomIntake
Conversational symptom collection and AI analysis component.

**Features:**
- Natural language symptom description
- AI-powered symptom analysis using Genkit
- Severity and urgency assessment
- Recommended specializations
- Emergency warnings

**Usage:**
```tsx
<SymptomIntake
  patientName="John Doe"
  patientAgeCategory="elder"
  onAnalysisComplete={(analysis) => console.log(analysis)}
/>
```

### AppointmentForm
Form for entering appointment details after symptom analysis.

**Features:**
- Pre-filled specialization from symptom analysis
- Date/time picker with validation
- Duration selection
- Location input
- Conflict detection
- Notes field

**Usage:**
```tsx
<AppointmentForm
  userId={user.uid}
  profileId={profile.id}
  patientName="John Doe"
  symptomAnalysis={analysis}
  onSuccess={() => console.log('Appointment created')}
/>
```

### AppointmentList
Displays appointments in a list format with actions.

**Features:**
- Status badges (scheduled, completed, cancelled, no-show)
- Upcoming/past appointment filtering
- Quick actions (view, edit, cancel, complete)
- Symptom display
- Notes display

**Usage:**
```tsx
<AppointmentList
  appointments={appointments}
  onViewDetails={(apt) => console.log(apt)}
  onCancel={(id) => cancelAppointment(id)}
  onComplete={(id) => completeAppointment(id)}
/>
```

### AppointmentCalendar
Calendar view of appointments with month navigation.

**Features:**
- Monthly calendar grid
- Appointment indicators on dates
- Multiple appointments per day
- Today highlighting
- Month navigation
- Click to view appointment details

**Usage:**
```tsx
<AppointmentCalendar
  appointments={appointments}
  onDateSelect={(date) => console.log(date)}
  onAppointmentClick={(apt) => console.log(apt)}
/>
```

## Data Flow

1. **Symptom Intake**: User describes symptoms → AI analyzes → Returns analysis
2. **Appointment Form**: User fills details → Validates → Creates appointment in Firestore
3. **Display**: Appointments fetched from Firestore → Displayed in list/calendar views

## AI Integration

The symptom analyzer uses Genkit AI with the following flow:

```typescript
symptomAnalyzer({
  symptoms: "headache and dizziness",
  patientAgeCategory: "elder"
})
// Returns:
{
  symptoms: ["headache", "dizziness"],
  severity: "medium",
  recommendedSpecializations: ["Neurologist", "General Practitioner"],
  urgency: "routine",
  reasoning: "...",
  additionalQuestions: [...]
}
```

## Firestore Structure

```
users/{userId}/profiles/{profileId}/appointments/{appointmentId}
  - doctorName: string
  - specialization: string
  - dateTime: Timestamp
  - duration: number
  - location: string
  - symptoms: string[]
  - notes: string
  - status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  - remindersSent: boolean[]
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

## Requirements Addressed

- **Requirement 3.1**: Conversational symptom intake with AI
- **Requirement 3.2**: Symptom analysis and specialization matching
- **Requirement 3.3**: Appointment booking with calendar integration
- **Requirement 3.4**: Appointment list and detail views

## Future Enhancements

- Voice-based symptom intake
- Calendar sync with Google/Outlook
- Appointment reminders (24h and 1h before)
- Telemedicine integration
- Doctor availability checking
- Insurance information
