# Appointment Reminder System

This document describes the appointment reminder system implementation in AgoraCare.

## Overview

The appointment reminder system automatically schedules and sends notifications to users before their scheduled appointments. It follows the requirement to send reminders at two specific times:
- **24 hours before** the appointment
- **1 hour before** the appointment

## Architecture

### Components

1. **Firestore Operations** (`src/firebase/firestore/appointments.ts`)
   - `updateReminderSent()` - Updates the reminder status in the appointment document
   - Appointment documents include `remindersSent: boolean[]` array to track which reminders have been sent

2. **Reminder Scheduler** (`src/lib/appointment-reminder-scheduler.ts`)
   - `scheduleAppointmentReminders()` - Schedules both reminders for a single appointment
   - `scheduleAllAppointmentReminders()` - Schedules reminders for all upcoming appointments
   - `rescheduleAppointmentReminders()` - Cancels old reminders and creates new ones
   - `cancelAppointmentReminders()` - Cancels all reminders for an appointment
   - `acknowledgeAppointmentReminder()` - Marks a reminder as acknowledged
   - `AppointmentReminderScheduler` - Service class for periodic reminder processing

3. **React Hook** (`src/hooks/use-appointment-reminders.ts`)
   - Provides easy-to-use functions for managing reminders in React components
   - Automatically schedules reminders for all appointments on mount

4. **API Route** (`src/app/api/appointments/reminders/route.ts`)
   - `POST /api/appointments/reminders` - Schedule reminders for a specific appointment
   - `GET /api/appointments/reminders` - Process and send due reminders (for cron jobs)

## Data Flow

### Creating an Appointment

```
User creates appointment
  ↓
Appointment saved to Firestore
  ↓
scheduleAppointmentReminders() called
  ↓
Two notification documents created:
  - 24-hour reminder (scheduledFor: appointmentTime - 24h)
  - 1-hour reminder (scheduledFor: appointmentTime - 1h)
  ↓
Notifications stored in Firestore with status: 'scheduled'
```

### Sending Reminders

```
Cron job calls GET /api/appointments/reminders
  ↓
Query notifications where:
  - type = 'appointment-reminder'
  - status = 'scheduled'
  - scheduledFor <= now + 5 minutes
  ↓
For each notification:
  - Send push notification (via FCM)
  - Update notification status to 'sent'
  - Update appointment.remindersSent[index] = true
```

### Updating an Appointment

```
User updates appointment date/time
  ↓
rescheduleAppointmentReminders() called
  ↓
Cancel existing scheduled reminders
  ↓
Create new reminders with updated times
```

### Cancelling an Appointment

```
User cancels appointment
  ↓
cancelAppointmentReminders() called
  ↓
All scheduled reminders marked as 'cancelled'
```

## Firestore Schema

### Appointment Document
```typescript
{
  id: string;
  profileId: string;
  doctorName: string;
  specialization: string;
  dateTime: Timestamp;
  duration: number;
  location: string;
  remindersSent: [boolean, boolean]; // [24h sent, 1h sent]
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  // ... other fields
}
```

### Notification Document
```typescript
{
  id: string;
  userId: string;
  profileId: string;
  type: 'appointment-reminder';
  title: string;
  body: string;
  data: {
    appointmentId: string;
    doctorName: string;
    specialization: string;
    appointmentTime: string;
    location: string;
    reminderType: '24-hour' | '1-hour';
  };
  scheduledFor: Timestamp;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  priority: 'normal' | 'high';
  requireInteraction: boolean;
  read: boolean;
  actionUrl: string;
  createdAt: Timestamp;
  sentAt?: Timestamp;
}
```

## Usage Examples

### In React Components

```tsx
import { useAppointmentReminders } from '@/hooks/use-appointment-reminders';

function AppointmentComponent() {
  const { user } = useAuth();
  const { activeProfile } = useFamilyContext();
  const { scheduleReminders, cancelReminders } = useAppointmentReminders(
    user?.uid,
    activeProfile?.id
  );

  const handleCreateAppointment = async (appointmentData) => {
    // Create appointment
    const appointment = await createAppointment(appointmentData);
    
    // Schedule reminders
    await scheduleReminders(appointment);
  };

  const handleCancelAppointment = async (appointmentId) => {
    // Cancel appointment
    await cancelAppointment(appointmentId);
    
    // Cancel reminders
    await cancelReminders(appointmentId);
  };
}
```

### Automatic Scheduling

The `use-appointments` hook automatically schedules reminders when appointments are created or updated:

```tsx
const { addAppointment, editAppointment, cancelAppointment } = useAppointments(
  user?.uid,
  activeProfile?.id
);

// Reminders are automatically scheduled
await addAppointment(appointmentData);

// Reminders are automatically rescheduled if date changes
await editAppointment(appointmentId, { dateTime: newDate });

// Reminders are automatically cancelled
await cancelAppointment(appointmentId);
```

## Cron Job Setup

For production, set up a cron job or Cloud Scheduler to call the reminder processing endpoint:

### Using Cloud Scheduler (Google Cloud)

```bash
gcloud scheduler jobs create http appointment-reminders \
  --schedule="*/5 * * * *" \
  --uri="https://your-app.com/api/appointments/reminders" \
  --http-method=GET \
  --time-zone="America/New_York"
```

### Using Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/appointments/reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Using Node-Cron (Development)

```typescript
import cron from 'node-cron';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await fetch('http://localhost:3000/api/appointments/reminders');
});
```

## Testing

### Manual Testing

1. Create an appointment 25 hours in the future
2. Check Firestore for two notification documents
3. Manually update notification `scheduledFor` to current time
4. Call `GET /api/appointments/reminders`
5. Verify notification status changed to 'sent'
6. Verify appointment `remindersSent` array updated

### Unit Tests

```typescript
describe('Appointment Reminders', () => {
  it('should schedule two reminders for new appointment', async () => {
    const appointment = createTestAppointment();
    const notificationIds = await scheduleAppointmentReminders(
      firestore,
      userId,
      profileId,
      appointment
    );
    expect(notificationIds).toHaveLength(2);
  });

  it('should not schedule past reminders', async () => {
    const appointment = createTestAppointment({
      dateTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    });
    const notificationIds = await scheduleAppointmentReminders(
      firestore,
      userId,
      profileId,
      appointment
    );
    expect(notificationIds).toHaveLength(1); // Only 1-hour reminder
  });
});
```

## Requirements Addressed

✅ **Requirement 3.5**: Appointment reminders at 24 hours and 1 hour before scheduled time
- Two reminders created automatically when appointment is booked
- Reminders delivered via push notifications
- Reminder acknowledgment tracking via `remindersSent` array

## Future Enhancements

- [ ] SMS reminders via Twilio
- [ ] Email reminders
- [ ] Customizable reminder times
- [ ] Snooze functionality
- [ ] Voice reminders via Agora
- [ ] Reminder preferences per appointment type
- [ ] Multiple reminder options (e.g., 1 week, 3 days, 1 day, 1 hour)
- [ ] Reminder delivery confirmation
- [ ] Retry logic for failed reminders
