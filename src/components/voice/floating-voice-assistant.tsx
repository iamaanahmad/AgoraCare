'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Mic, Phone } from 'lucide-react';
import { ChatInterface } from '@/components/voice/chat-interface';
import { VoiceControlPanel } from '@/components/voice/voice-control-panel';
import { useVoice } from '@/contexts/voice-context';

export function FloatingVoiceAssistant() {
  const { voiceState } = useVoice();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className={`fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl transition-all hover:scale-105 z-50 ${
            voiceState.isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary'
          }`}
        >
          {voiceState.isConnected ? (
            <Phone className="h-8 w-8 text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-slate-50/50 backdrop-blur-md">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            AgoraCare Assistant
          </SheetTitle>
          <SheetDescription>
            Talk to your AI assistant for help, or connect to a live nurse.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden p-6 pt-2 flex flex-col gap-4">
          <VoiceControlPanel className="shrink-0 shadow-sm" />
          <div className="flex-1 min-h-0">
            <ChatInterface className="h-full shadow-sm" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
