'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Mic, Phone, PhoneOff, MicOff, Volume2 } from 'lucide-react';
import { ChatInterface } from '@/components/voice/chat-interface';
import { useVoice } from '@/contexts/voice-context';

export function FloatingVoiceAssistant() {
  const { voiceState, disconnect, toggleMute } = useVoice();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className={`fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl transition-all hover:scale-105 z-50 ${
            voiceState.isConnected 
              ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse ring-4 ring-emerald-400/40' 
              : voiceState.isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-primary'
          }`}
          title={voiceState.isConnected ? 'Live Audio Call Active' : 'Open AgoraCare Voice Assistant'}
        >
          {voiceState.isConnected ? (
            <Phone className="h-8 w-8 text-white animate-bounce" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l shadow-2xl z-50">
        <SheetHeader className="p-4 sm:p-5 pb-3 border-b bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mic className="h-4 w-4" />
              </div>
              <span>Aria (AI Assistant)</span>
            </SheetTitle>

            {/* Live Call Control Pills if connected */}
            {voiceState.isConnected && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Call</span>
              </div>
            )}
          </div>

          <SheetDescription className="text-xs text-muted-foreground">
            {voiceState.isConnected 
              ? 'Connected to live healthcare line. Speak normally.'
              : 'Talk in Hindi or English for health triage, meds, and care coordination.'}
          </SheetDescription>

          {/* Connected Live Voice Call Audio Controls Bar */}
          {voiceState.isConnected && (
            <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-emerald-950 text-white shadow-md">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-800 text-emerald-300">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-emerald-200">Agora Voice Active</p>
                  <p className="text-[10px] text-emerald-400">Two-way audio streaming</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleMute}
                  className="h-8 px-2.5 text-xs font-medium"
                >
                  <MicOff className="h-3.5 w-3.5 mr-1 text-slate-600" />
                  Mute
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => disconnect()}
                  className="h-8 px-2.5 text-xs font-medium"
                >
                  <PhoneOff className="h-3.5 w-3.5 mr-1" />
                  End Call
                </Button>
              </div>
            </div>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden p-3 sm:p-4 flex flex-col min-h-0">
          <ChatInterface className="h-full border-none shadow-none bg-transparent" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
