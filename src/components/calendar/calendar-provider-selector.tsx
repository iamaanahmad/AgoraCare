'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useFirestore } from '@/firebase';
import { getAllCalendarSyncs, deleteCalendarSync } from '@/firebase/firestore/calendar-sync';
import { CalendarSync } from '@/lib/calendar/types';

export function CalendarProviderSelector() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadSyncs();
  }, [user, firestore]);

  const loadSyncs = async () => {
    if (!user || !firestore) {
      setLoading(false);
      return;
    }

    try {
      const data = await getAllCalendarSyncs(firestore, user.uid);
      setSyncs(data);
    } catch (error) {
      console.error('Error loading calendar syncs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: 'google' | 'outlook') => {
    if (!user) return;

    setConnecting(provider);
    try {
      const response = await fetch(`/api/calendar/${provider}/auth?userId=${user.uid}`);
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
      toast({
        title: 'Connection Failed',
        description: `Failed to connect to ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`,
        variant: 'destructive',
      });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    if (!user || !firestore) return;

    try {
      await deleteCalendarSync(firestore, user.uid, provider);
      await loadSyncs();
      toast({
        title: 'Calendar Disconnected',
        description: `${provider === 'google' ? 'Google' : 'Outlook'} Calendar has been disconnected`,
      });
    } catch (error) {
      console.error(`Error disconnecting ${provider}:`, error);
      toast({
        title: 'Disconnection Failed',
        description: `Failed to disconnect ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`,
        variant: 'destructive',
      });
    }
  };

  const isConnected = (provider: 'google' | 'outlook') => {
    return syncs.some((sync) => sync.provider === provider && sync.syncEnabled);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect your Google or Outlook calendar to sync appointments automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Calendar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-muted-foreground">
                {isConnected('google') ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {isConnected('google') ? (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('google')}
              >
                <X className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('google')}
              disabled={connecting === 'google'}
            >
              {connecting === 'google' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          )}
        </div>

        {/* Outlook Calendar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Outlook Calendar</p>
              <p className="text-sm text-muted-foreground">
                {isConnected('outlook') ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {isConnected('outlook') ? (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('outlook')}
              >
                <X className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('outlook')}
              disabled={connecting === 'outlook'}
            >
              {connecting === 'outlook' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
