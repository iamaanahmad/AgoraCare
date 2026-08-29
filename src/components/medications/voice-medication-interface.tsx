/**
 * Voice-Enabled Medication Interface
 * Combines medication management with voice commands
 */

'use client';

import React, { useEffect } from 'react';
import { useVoice } from '@/contexts/voice-context';
import { useVoiceMedication } from '@/hooks/use-voice-medication';
import { ChatInterface } from '@/components/voice/chat-interface';
import { VoiceControlPanel } from '@/components/voice/voice-control-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, MessageSquare } from 'lucide-react';

interface VoiceMedicationInterfaceProps {
  userId: string;
  profileId: string;
  className?: string;
}

export function VoiceMedicationInterface({
  userId,
  profileId,
  className,
}: VoiceMedicationInterfaceProps) {
  const { isConnected, connect } = useVoice();
  const { 
    isInConversation, 
    conversationProgress 
  } = useVoiceMedication({
    userId,
    profileId,
    enabled: isConnected,
  });

  // Auto-connect to voice channel on mount
  useEffect(() => {
    if (!isConnected) {
      connect(`medication-${profileId}`);
    }
  }, []);

  return (
    <div className={className}>
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="controls">
            <Pill className="h-4 w-4 mr-2" />
            Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <ChatInterface
            className="h-[600px]"
            placeholder="Say 'add medication' or 'what's my next dose?'"
          />

          {isInConversation && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Conversation in Progress</CardTitle>
                <CardDescription>
                  Step {conversationProgress.current} of {conversationProgress.total}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${conversationProgress.percentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="controls" className="mt-4">
          <VoiceControlPanel defaultChannel={`medication-${profileId}`} />

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Voice Commands</CardTitle>
              <CardDescription>
                Try these voice commands to manage your medications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Add medication:</strong>
                  <p className="text-muted-foreground">
                    "Add a new medication" or "I need to add medicine"
                  </p>
                </div>
                <div>
                  <strong>Mark as taken:</strong>
                  <p className="text-muted-foreground">
                    "I took my medication" or "Mark as taken"
                  </p>
                </div>
                <div>
                  <strong>Check schedule:</strong>
                  <p className="text-muted-foreground">
                    "What's my next dose?" or "Show my medications"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
