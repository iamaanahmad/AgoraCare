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
  placeholder = 'Type a message or speak in English / Hindi...'
}: ChatInterfaceProps) {
  const { 
    voiceState, 
    messages, 
    sendMessage,
    toggleMute,
    startRecording,
    stopRecording,
    voiceLanguage,
    setVoiceLanguage,
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

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="font-semibold text-foreground">Aria Health Assistant</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask about medications, symptoms, or check-ups in English or Hindi.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => sendMessage('When should I take my Lisinopril medication?')}
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  "When should I take Lisinopril?"
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage('Mujhe heart pain aur saans lene me dikkat ho rahi hai')}
                  className="text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  "Emergency Help"
                </button>
              </div>
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
                    'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted/80 text-foreground border rounded-bl-none'
                  )}
                >
                  <p className="leading-relaxed">{message.content}</p>
                  <p className="text-[10px] opacity-60 mt-1 text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {voiceState.isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted/80 rounded-2xl px-4 py-3 border flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Aria is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Voice Activity Indicator */}
      {voiceState.isRecording && (
        <div className="px-4 py-2 bg-red-500/10 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-4 bg-red-500 animate-pulse" />
              <div className="w-1.5 h-4 bg-red-500 animate-pulse delay-75" />
              <div className="w-1.5 h-4 bg-red-500 animate-pulse delay-150" />
            </div>
            <span className="text-xs font-medium text-red-600">
              {voiceState.currentMessage ? `"${voiceState.currentMessage}"` : 'Listening in Hinglish/English...'}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={stopRecording} className="text-xs h-6 px-2 text-red-700 hover:bg-red-500/20">
            Done
          </Button>
        </div>
      )}

      {/* Error Display */}
      {voiceState.error && (
        <div className="px-4 py-2 bg-destructive/10 border-t">
          <p className="text-xs text-destructive">{voiceState.error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t bg-background/50">
        {/* Language selector bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">Speech Language:</span>
          <div className="flex gap-1 bg-muted/60 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setVoiceLanguage('en-IN')}
              className={cn(
                'px-2 py-0.5 rounded-md font-medium transition-all',
                voiceLanguage === 'en-IN' ? 'bg-background shadow-xs text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              🇮🇳 Hinglish / English
            </button>
            <button
              type="button"
              onClick={() => setVoiceLanguage('hi-IN')}
              className={cn(
                'px-2 py-0.5 rounded-md font-medium transition-all',
                voiceLanguage === 'hi-IN' ? 'bg-background shadow-xs text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              🇮🇳 हिंदी
            </button>
          </div>
        </div>

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
              title={voiceState.isRecording ? 'Stop Recording' : 'Speak to Aria'}
              className={cn(
                'transition-all shrink-0',
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
            className="flex-1 text-sm"
          />

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || voiceState.isProcessing}
            size="icon"
            className="shrink-0"
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
