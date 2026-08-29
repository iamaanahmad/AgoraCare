'use client';

import { useState, useEffect } from 'react';
import { Phone, Users, AlertTriangle, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmergencyContact } from '@/firebase/firestore/users';
import { cn } from '@/lib/utils';

interface EmergencyPanelProps {
  isActive: boolean;
  onClose: () => void;
  onCallDoctor: () => void;
  onNotifyFamily: () => void;
  emergencyContacts: EmergencyContact[];
  triggerKeyword?: string;
}

export function EmergencyPanel({
  isActive,
  onClose,
  onCallDoctor,
  onNotifyFamily,
  emergencyContacts,
  triggerKeyword,
}: EmergencyPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Play alert sound when emergency is activated
  useEffect(() => {
    if (isActive && !isPlaying) {
      playAlertSound();
      setIsPlaying(true);
    }
  }, [isActive, isPlaying]);

  const playAlertSound = () => {
    // Play emergency alert sound
    const audio = new Audio('/sounds/emergency-alert.mp3');
    audio.play().catch(err => console.error('Error playing alert sound:', err));
  };

  const primaryContact = emergencyContacts.find(c => c.priority === 1);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl border-red-500 border-4 shadow-2xl">
        <CardHeader className="bg-red-500 text-white relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-red-600"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Emergency Mode</CardTitle>
              <CardDescription className="text-red-100">
                {triggerKeyword ? `Detected: "${triggerKeyword}"` : 'Emergency assistance activated'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Alert Message */}
          <Alert className="border-red-500 bg-red-50">
            <Volume2 className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-lg font-medium text-red-900">
              Emergency services are ready. Choose an action below.
            </AlertDescription>
          </Alert>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Call Doctor Button */}
            <Button
              size="lg"
              className={cn(
                "h-32 text-2xl font-bold flex flex-col gap-3",
                "bg-red-600 hover:bg-red-700 text-white",
                "transition-all duration-200 transform hover:scale-105"
              )}
              onClick={onCallDoctor}
            >
              <Phone className="h-12 w-12" />
              <span>Call Doctor</span>
            </Button>

            {/* Notify Family Button */}
            <Button
              size="lg"
              className={cn(
                "h-32 text-2xl font-bold flex flex-col gap-3",
                "bg-orange-600 hover:bg-orange-700 text-white",
                "transition-all duration-200 transform hover:scale-105"
              )}
              onClick={onNotifyFamily}
            >
              <Users className="h-12 w-12" />
              <span>Notify Family</span>
            </Button>
          </div>

          {/* Emergency Contacts Display */}
          {emergencyContacts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Emergency Contacts</h3>
              <div className="space-y-2">
                {emergencyContacts.slice(0, 3).map((contact) => (
                  <Card key={contact.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg">{contact.phoneNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            Priority {contact.priority}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Primary Contact Quick Info */}
          {primaryContact && (
            <Alert className="bg-blue-50 border-blue-500">
              <Phone className="h-5 w-5 text-blue-600" />
              <AlertDescription>
                <span className="font-semibold">Primary Contact:</span> {primaryContact.name} (
                {primaryContact.relationship}) - {primaryContact.phoneNumber}
              </AlertDescription>
            </Alert>
          )}

          {/* Cancel Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="text-lg px-8"
            >
              Cancel Emergency
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
