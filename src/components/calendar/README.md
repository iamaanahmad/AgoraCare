# Calendar Components

This directory contains calendar-related components for the AgoraCare application.

## Components

### UnifiedCalendarView

A comprehensive calendar component that displays both AgoraCare appointments and external calendar events (Google Calendar and Outlook) in a single unified view.

#### Features

1. **Multi-Source Display**
   - Shows AgoraCare appointments
   - Displays Google Calendar events (when connected)
   - Displays Outlook Calendar events (when connected)
   - Color-coded events by source for easy identification

2. **Event Filtering and Categorization**
   - Filter panel to show/hide events from different sources
   - Toggle visibility of AgoraCare, Google, and Outlook events
   - Visual indicators for each event source

3. **Sync Status Indicators**
   - Real-time sync status for each connected calendar
   - Last sync timestamp display
   - Connection status indicators (connected/disconnected)
   - Error messages for sync failures

4. **Manual Sync Trigger**
   - Manual sync button with loading state
   - Automatic refresh after successful sync
   - Toast notifications for sync success/failure

5. **Error Handling UI**
   - Clear error messages for sync failures
   - Retry mechanism through manual sync
   - Graceful degradation when calendars are not connected
   - User-friendly error notifications

#### Usage

```tsx
import { UnifiedCalendarView } from '@/components/calendar/unified-calendar-view';

function MyPage() {
  const { user } = useUser();
  const { selectedMember } = useFamily();
  const { appointments } = useAppointments(user?.uid, selectedMember?.id);

  return (
    <UnifiedCalendarView
      appointments={appointments}
      userId={user.uid}
      profileId={selectedMember.id}
      onAppointmentClick={(appointment) => {
        // Handle appointment click
      }}
      onExternalEventClick={(event) => {
        // Handle external event click
      }}
      onDateSelect={(date) => {
        // Handle date selection
      }}
    />
  );
}
```

#### Props

- `appointments`: Array of AgoraCare appointments
- `userId`: Current user ID
- `profileId`: Active profile ID
- `onDateSelect?`: Callback when a date is clicked
- `onAppointmentClick?`: Callback when an appointment is clicked
- `onExternalEventClick?`: Callback when an external event is clicked

#### Visual Design

- **Color Coding**:
  - Primary color (blue): AgoraCare appointments
  - Blue: Google Calendar events
  - Orange: Outlook Calendar events

- **Status Indicators**:
  - Green checkmark: Calendar connected and synced
  - Alert icon: Calendar not connected or sync error

- **Layout**:
  - Card-based design with proper spacing (16px minimum)
  - Responsive grid layout for calendar days
  - Accessible buttons and interactive elements
  - Clear visual hierarchy

#### Requirements Addressed

- **Requirement 7.4**: Displays unified calendar view showing both medical appointments and synced external events
- **Requirement 7.5**: Notifies users when calendar synchronization fails and provides retry mechanism

#### Integration

The component integrates with:
- `useCalendarSync` hook for calendar synchronization
- Firebase Firestore for appointment data
- Google Calendar API for Google events
- Microsoft Outlook API for Outlook events
- Toast notifications for user feedback

#### Error Handling

The component handles various error scenarios:
1. **Sync Failures**: Shows error toast and allows manual retry
2. **Load Failures**: Displays error message and suggests sync
3. **Connection Issues**: Gracefully hides unavailable calendar sources
4. **Token Expiration**: Automatically handled by the sync service

#### Accessibility

- Keyboard navigation support
- ARIA labels for interactive elements
- High contrast color schemes
- Clear visual feedback for interactions
- Minimum 16px spacing between elements
- WCAG AA compliant color contrast ratios
