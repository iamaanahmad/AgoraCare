# Profile Management System

This directory contains all components related to user profile management in AgoraCare.

## Components

### ProfileForm
Form component for creating and editing user profiles.
- **Props:**
  - `profile?: UserProfile` - Existing profile data for editing
  - `onSubmit: (data: ProfileFormData) => Promise<void>` - Submit handler
  - `onCancel?: () => void` - Cancel handler
  - `isLoading?: boolean` - Loading state

**Features:**
- Avatar upload with preview
- Name input with validation
- Age category selection (child/adult/elder)
- Optional date of birth
- Form validation

### ProfilePreferencesForm
Form for managing profile preferences including voice, notifications, and accessibility settings.
- **Props:**
  - `preferences: ProfilePreferences` - Current preferences
  - `onSubmit: (preferences: ProfilePreferences) => Promise<void>` - Submit handler
  - `isLoading?: boolean` - Loading state

**Features:**
- Voice settings (enable/disable, language selection)
- Notification preferences (sound, vibration, lead time)
- Accessibility settings (mode, font size)

### EmergencyContactForm
Component for managing emergency contacts with add/delete functionality.
- **Props:**
  - `contacts: EmergencyContact[]` - Current emergency contacts
  - `onAdd: (contact: Omit<EmergencyContact, 'id'>) => Promise<void>` - Add handler
  - `onUpdate: (id: string, contact: Partial<EmergencyContact>) => Promise<void>` - Update handler
  - `onDelete: (id: string) => Promise<void>` - Delete handler
  - `isLoading?: boolean` - Loading state

**Features:**
- List of existing contacts with priority ordering
- Add new contact form with validation
- Phone number and email validation
- Notification preference selection
- Delete confirmation dialog

### ProfileSwitcher
Component for switching between family member profiles.
- **Props:**
  - `profiles: UserProfile[]` - All available profiles
  - `activeProfile: UserProfile` - Currently active profile
  - `onProfileSelect: (profile: UserProfile) => void` - Profile selection handler
  - `onAddProfile?: () => void` - Add profile handler
  - `showAddButton?: boolean` - Show/hide add button

**Features:**
- Visual profile cards with avatars
- Active profile indicator
- Quick access to recent profiles
- Add new profile button
- Profile selection dialog

## Hooks

### useProfiles
Custom hook for profile management operations.

**Returns:**
- `isLoading: boolean` - Loading state
- `fetchProfiles: () => Promise<UserProfile[]>` - Fetch all profiles
- `createProfile: (data) => Promise<string>` - Create new profile
- `updateProfile: (id, updates) => Promise<void>` - Update profile
- `deleteProfile: (id) => Promise<void>` - Delete profile
- `switchProfile: (id) => Promise<void>` - Set active profile
- `updatePreferences: (id, preferences) => Promise<void>` - Update preferences
- `addEmergencyContact: (id, contact) => Promise<void>` - Add emergency contact
- `updateEmergencyContact: (id, contactId, updates) => Promise<void>` - Update contact
- `deleteEmergencyContact: (id, contactId) => Promise<void>` - Delete contact

## Data Models

### UserProfile
```typescript
interface UserProfile {
  id: string;
  userId: string;
  name: string;
  dateOfBirth?: Date;
  ageCategory: 'child' | 'adult' | 'elder';
  avatar?: string;
  emergencyContacts: EmergencyContact[];
  preferences: ProfilePreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

### EmergencyContact
```typescript
interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  priority: number;
  notificationPreference: 'call' | 'sms' | 'both';
}
```

### ProfilePreferences
```typescript
interface ProfilePreferences {
  voiceEnabled: boolean;
  voiceLanguage: string;
  notificationSound: boolean;
  notificationVibration: boolean;
  reminderLeadTime: number;
  accessibilityMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}
```

## Usage Example

```typescript
import { ProfileSwitcher, ProfileForm } from '@/components/profile';
import { useProfiles } from '@/hooks/use-profiles';

function MyComponent() {
  const { profiles, createProfile, switchProfile } = useProfiles();
  const [activeProfile, setActiveProfile] = useState(profiles[0]);

  return (
    <>
      <ProfileSwitcher
        profiles={profiles}
        activeProfile={activeProfile}
        onProfileSelect={(profile) => {
          setActiveProfile(profile);
          switchProfile(profile.id);
        }}
        onAddProfile={() => setShowCreateDialog(true)}
      />
      
      <ProfileForm
        onSubmit={async (data) => {
          await createProfile(data);
        }}
      />
    </>
  );
}
```

## Firestore Structure

```
users/
  {userId}/
    - email, displayName, role, activeProfileId
    
    profiles/
      {profileId}/
        - name, dateOfBirth, ageCategory, avatar
        - preferences: { voiceEnabled, voiceLanguage, ... }
        - emergencyContacts: [{ id, name, phoneNumber, ... }]
        - createdAt, updatedAt
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.2**: Multiple user profiles within a single account
- **Requirement 1.3**: Profile creation with name, age category, and emergency contacts
- **Requirement 1.4**: Profile switching without re-authentication
- **Requirement 1.5**: Profile-specific data display (medications, appointments, adherence)

## Accessibility Features

- Large, accessible buttons and inputs (minimum 16px)
- Clear visual hierarchy with card-based layouts
- Keyboard navigation support
- Screen reader compatible with ARIA labels
- High contrast color schemes
- Adjustable font sizes
- Form validation with clear error messages
