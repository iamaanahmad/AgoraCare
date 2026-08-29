/**
 * Voice Control Panel Component
 * Controls for connecting, disconnecting, and managing voice interface
 */

'use client';

import React, { useState } from 'react';
import { useVoice } from '@/contexts/voice-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Trash2 } from 'lucide-react';
import { VoiceActivityIndicator } from './voice-activity-indicator';

interface VoiceControlPanelProps {
  defaultChannel?: string;
  className?: string;
}

export function VoiceControlPanel({ 
  defaultChannel = 'agoracare-main',
  className 
}: VoiceControlPanelProps) {
  const { 
    voiceState, 
    isConnected,
    connect, 
    disconnect, 
    toggleMute,
    clearMessages 
  } = useVoice();

  const [channel, setChannel] = useState(defaultChannel);

  const handleConnect = async () => {
    try {
      await connect(channel);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Voice Controls
        </CardTitle>
        <CardDescription>
          Manage your voice connection and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <VoiceActivityIndicator size="sm" showLabel={false} />
        </div>

        {/* Channel Input */}
        {!isConnected && (
          <div className="space-y-2">
            <Label htmlFor="channel">Channel Name</Label>
            <Input
              id="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="Enter channel name"
            />
          </div>
        )}

        {/* Connection Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect} 
              className="flex-1"
              disabled={!channel.trim()}
            >
              <Phone className="h-4 w-4 mr-2" />
              Connect
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleDisconnect} 
                variant="destructive"
                className="flex-1"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
              <Button
                onClick={toggleMute}
                variant="outline"
              >
                {voiceState.isRecording ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>

        {/* Clear Messages */}
        {isConnected && (
          <Button
            onClick={clearMessages}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Messages
          </Button>
        )}

        {/* Error Display */}
        {voiceState.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{voiceState.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
