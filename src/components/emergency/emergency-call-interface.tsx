'use client';

import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CallState } from '@/lib/emergency/emergency-call-service';
import { EmergencyContact } from '@/firebase/firestore/users';

interface EmergencyCallInterfaceProps {
  callState: CallState;
  contact: EmergencyContact | null;
  duration: string;
  isMuted: boolean;
  onEndCall: () => void;
  onToggleMute: () => void;
}

export function EmergencyCallInterface({
  callState,
  contact,
  duration,
  isMuted,
  onEndCall,
  onToggleMute,
}: EmergencyCallInterfaceProps) {
  if (callState === 'idle' || !contact) return null;

  const getStateLabel = () => {
    switch (callState) {
      case 'initiating':
        return 'Initiating call...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call ended';
      case 'failed':
        return 'Call failed';
      default:
        return '';
    }
  };

  const getStateColor = () => {
    switch (callState) {
      case 'initiating':
      case 'ringing':
        return 'bg-yellow-500';
      case 'connected':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-4 border-red-500">
        <CardContent className="p-8">
          {/* Contact Info */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-1">{contact.name}</h2>
            <p className="text-muted-foreground mb-2">{contact.relationship}</p>
            <p className="text-sm font-mono">{contact.phoneNumber}</p>
          </div>

          {/* Call State */}
          <div className="text-center mb-6">
            <Badge
              variant="outline"
              className={cn(
                'text-lg px-4 py-2',
                callState === 'ringing' && 'animate-pulse'
              )}
            >
              <div className={cn('w-2 h-2 rounded-full mr-2', getStateColor())} />
              {getStateLabel()}
            </Badge>
          </div>

          {/* Call Duration */}
          {callState === 'connected' && (
            <div className="text-center mb-8">
              <p className="text-4xl font-mono font-bold">{duration}</p>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex justify-center gap-4 mb-6">
            {/* Mute Button */}
            {callState === 'connected' && (
              <Button
                size="lg"
                variant={isMuted ? 'destructive' : 'secondary'}
                className="w-16 h-16 rounded-full"
                onClick={onToggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            )}

            {/* End Call Button */}
            {['ringing', 'connected'].includes(callState) && (
              <Button
                size="lg"
                variant="destructive"
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                onClick={onEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Call Info */}
          <div className="text-center text-sm text-muted-foreground">
            {callState === 'ringing' && (
              <p>Calling emergency contact...</p>
            )}
            {callState === 'connected' && (
              <p>Emergency call in progress</p>
            )}
            {callState === 'initiating' && (
              <p>Setting up emergency call...</p>
            )}
          </div>

          {/* Recording Indicator */}
          {callState === 'connected' && (
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="text-xs">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                Call is being recorded
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
