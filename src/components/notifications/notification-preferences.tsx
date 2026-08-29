'use client';

import React, { useState } from 'react';
import { Bell, Volume2, Vibrate, Mic, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/notification-context';
import { useToast } from '@/hooks/use-toast';

export function NotificationPreferences() {
  const { preferences, updatePreferences, permissionStatus, requestPermission } = useNotifications();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    setIsLoading(true);
    try {
      await updatePreferences({ [key]: value });
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = async (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setIsLoading(true);
    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quiet hours. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive medication reminders.',
      });
    } else {
      toast({
        title: 'Permission denied',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {permissionStatus !== 'granted' && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Enable Notifications
            </CardTitle>
            <CardDescription>
              Allow notifications to receive medication reminders and important alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRequestPermission} className="w-full">
              Enable Notifications
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive all notifications
              </p>
            </div>
            <Switch
              id="enabled"
              checked={preferences.enabled}
              onCheckedChange={(checked) => handleToggle('enabled', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Sound
              </Label>
              <p className="text-sm text-muted-foreground">
                Play sound for notifications
              </p>
            </div>
            <Switch
              id="sound"
              checked={preferences.sound}
              onCheckedChange={(checked) => handleToggle('sound', checked)}
              disabled={isLoading || !preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="vibration" className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                Vibration
              </Label>
              <p className="text-sm text-muted-foreground">
                Vibrate on notifications (mobile only)
              </p>
            </div>
            <Switch
              id="vibration"
              checked={preferences.vibration}
              onCheckedChange={(checked) => handleToggle('vibration', checked)}
              disabled={isLoading || !preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voiceAnnouncement" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Announcements
              </Label>
              <p className="text-sm text-muted-foreground">
                Read notifications aloud
              </p>
            </div>
            <Switch
              id="voiceAnnouncement"
              checked={preferences.voiceAnnouncement}
              onCheckedChange={(checked) => handleToggle('voiceAnnouncement', checked)}
              disabled={isLoading || !preferences.enabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="medicationReminders">Medication Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when it's time to take medication
              </p>
            </div>
            <Switch
              id="medicationReminders"
              checked={preferences.medicationReminders}
              onCheckedChange={(checked) => handleToggle('medicationReminders', checked)}
              disabled={isLoading || !preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="appointmentReminders">Appointment Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming appointments
              </p>
            </div>
            <Switch
              id="appointmentReminders"
              checked={preferences.appointmentReminders}
              onCheckedChange={(checked) => handleToggle('appointmentReminders', checked)}
              disabled={isLoading || !preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emergencyAlerts">Emergency Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Critical alerts (always enabled)
              </p>
            </div>
            <Switch
              id="emergencyAlerts"
              checked={preferences.emergencyAlerts}
              disabled={true}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Silence non-urgent notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="quietHoursEnabled">Enable Quiet Hours</Label>
            <Switch
              id="quietHoursEnabled"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => handleToggle('quietHoursEnabled', checked)}
              disabled={isLoading || !preferences.enabled}
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart">Start Time</Label>
                <Input
                  id="quietHoursStart"
                  type="time"
                  value={preferences.quietHoursStart || '22:00'}
                  onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd">End Time</Label>
                <Input
                  id="quietHoursEnd"
                  type="time"
                  value={preferences.quietHoursEnd || '07:00'}
                  onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
