'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ProfilePreferences } from '@/firebase/firestore/users';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ProfilePreferencesFormProps {
  preferences: ProfilePreferences;
  onSubmit: (preferences: ProfilePreferences) => Promise<void>;
  isLoading?: boolean;
}

export function ProfilePreferencesForm({ preferences, onSubmit, isLoading }: ProfilePreferencesFormProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(preferences.voiceEnabled);
  const [notificationSound, setNotificationSound] = useState(preferences.notificationSound);
  const [notificationVibration, setNotificationVibration] = useState(preferences.notificationVibration);
  const [accessibilityMode, setAccessibilityMode] = useState(preferences.accessibilityMode);
  const [reminderLeadTime, setReminderLeadTime] = useState([preferences.reminderLeadTime]);
  const [voiceLanguage, setVoiceLanguage] = useState(preferences.voiceLanguage);
  const [fontSize, setFontSize] = useState(preferences.fontSize);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProfilePreferences>({
    defaultValues: preferences,
  });

  const handleFormSubmit = async () => {
    const updatedPreferences: ProfilePreferences = {
      voiceEnabled,
      voiceLanguage,
      notificationSound,
      notificationVibration,
      reminderLeadTime: reminderLeadTime[0],
      accessibilityMode,
      fontSize,
    };
    await onSubmit(updatedPreferences);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
          <CardDescription>
            Configure voice interaction preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Enabled */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voiceEnabled">Enable Voice Commands</Label>
              <p className="text-sm text-muted-foreground">
                Allow voice interaction with the app
              </p>
            </div>
            <Switch
              id="voiceEnabled"
              checked={voiceEnabled}
              onCheckedChange={setVoiceEnabled}
              disabled={isLoading}
            />
          </div>

          {/* Voice Language */}
          <div className="space-y-2">
            <Label htmlFor="voiceLanguage">Voice Language</Label>
            <Select
              value={voiceLanguage}
              onValueChange={setVoiceLanguage}
              disabled={!voiceEnabled || isLoading}
            >
              <SelectTrigger id="voiceLanguage" className="text-base">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Spanish</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
                <SelectItem value="it-IT">Italian</SelectItem>
                <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                <SelectItem value="ja-JP">Japanese</SelectItem>
                <SelectItem value="ko-KR">Korean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Customize how you receive reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Sound */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notificationSound">Notification Sound</Label>
              <p className="text-sm text-muted-foreground">
                Play sound for reminders
              </p>
            </div>
            <Switch
              id="notificationSound"
              checked={notificationSound}
              onCheckedChange={setNotificationSound}
              disabled={isLoading}
            />
          </div>

          {/* Notification Vibration */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notificationVibration">Vibration</Label>
              <p className="text-sm text-muted-foreground">
                Vibrate device for reminders
              </p>
            </div>
            <Switch
              id="notificationVibration"
              checked={notificationVibration}
              onCheckedChange={setNotificationVibration}
              disabled={isLoading}
            />
          </div>

          {/* Reminder Lead Time */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label htmlFor="reminderLeadTime">Reminder Lead Time</Label>
              <p className="text-sm text-muted-foreground">
                How early to receive reminders before scheduled time
              </p>
            </div>
            <div className="space-y-2">
              <Slider
                id="reminderLeadTime"
                min={0}
                max={60}
                step={5}
                value={reminderLeadTime}
                onValueChange={setReminderLeadTime}
                disabled={isLoading}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0 min</span>
                <span className="font-semibold text-foreground">
                  {reminderLeadTime[0]} minutes
                </span>
                <span>60 min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Settings</CardTitle>
          <CardDescription>
            Adjust display and interaction preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Accessibility Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="accessibilityMode">Enhanced Accessibility Mode</Label>
              <p className="text-sm text-muted-foreground">
                Optimize for screen readers and assistive technologies
              </p>
            </div>
            <Switch
              id="accessibilityMode"
              checked={accessibilityMode}
              onCheckedChange={setAccessibilityMode}
              disabled={isLoading}
            />
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="fontSize">Text Size</Label>
            <Select
              value={fontSize}
              onValueChange={(value) => setFontSize(value as ProfilePreferences['fontSize'])}
              disabled={isLoading}
            >
              <SelectTrigger id="fontSize" className="text-base">
                <SelectValue placeholder="Select text size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (14px)</SelectItem>
                <SelectItem value="medium">Medium (16px)</SelectItem>
                <SelectItem value="large">Large (18px)</SelectItem>
                <SelectItem value="extra-large">Extra Large (20px)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Larger text sizes improve readability for elderly users
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {(isSubmitting || isLoading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
