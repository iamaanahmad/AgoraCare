/**
 * Chat Interface Component
 * Dual-mode interface supporting both voice and text input
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useVoice } from '@/contexts/voice-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Send, 
  Loader2,
  Volume2,
  VolumeX 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  className?: string;
  showVoiceControls?: boolean;
  placeholder?: string;
}

export function ChatInterface({ 
  className,
  showVoiceControls = true,
  placeholder = 'Type a message or use voice...'
}: ChatInterfaceProps) {
  const { 
    voiceState, 
    messages, 
    sendMessage,
    toggleMute,
    startRecording,
    stopRecording 
  } = useVoice();

  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    await sendMessage(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (isVoiceMode) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsVoiceMode(!isVoiceMode);
  };

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation...</p>
              <p className="text-sm mt-2">
                {showVoiceControls ? 'Type or speak your message' : 'Type your message'}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.transcription && (
                    <p className="text-xs opacity-70 mt-1">
                      Transcription: {message.transcription}
                    </p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {voiceState.isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Voice Activity Indicator */}
      {voiceState.isRecording && (
        <div className="px-4 py-2 bg-primary/10 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-4 bg-red-500 animate-pulse" />
              <div className="w-1.5 h-4 bg-red-500 animate-pulse delay-75" />
              <div className="w-1.5 h-4 bg-red-500 animate-pulse delay-150" />
            </div>
            <span className="text-sm font-medium text-red-600">
              {voiceState.currentMessage ? `"${voiceState.currentMessage}"` : 'Listening... Speak in Hindi or English'}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={stopRecording} className="text-xs h-6 px-2 text-muted-foreground">
            Done
          </Button>
        </div>
      )}

      {/* Error Display */}
      {voiceState.error && (
        <div className="px-4 py-2 bg-destructive/10 border-t">
          <p className="text-sm text-destructive">{voiceState.error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          {showVoiceControls && (
            <Button
              type="button"
              variant={voiceState.isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={() => {
                if (voiceState.isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              disabled={voiceState.isProcessing}
              title={voiceState.isRecording ? 'Stop Recording' : 'Speak to AI'}
              className={cn(
                'transition-all',
                voiceState.isRecording && 'animate-pulse'
              )}
            >
              {voiceState.isRecording ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
          )}

          <Input
            ref={inputRef}
            value={voiceState.isRecording && voiceState.currentMessage ? voiceState.currentMessage : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={voiceState.isRecording ? 'Listening...' : placeholder}
            disabled={voiceState.isProcessing || voiceState.isRecording}
            className="flex-1"
          />

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || voiceState.isProcessing}
            size="icon"
          >
            {voiceState.isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {showVoiceControls && voiceState.isConnected && (
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Voice: Connected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="h-6 px-2"
            >
              {voiceState.isRecording ? (
                <>
                  <Volume2 className="h-3 w-3 mr-1" />
                  Unmuted
                </>
              ) : (
                <>
                  <VolumeX className="h-3 w-3 mr-1" />
                  Muted
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
