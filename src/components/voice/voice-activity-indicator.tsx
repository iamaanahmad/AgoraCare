/**
 * Voice Activity Indicator Component
 * Visual feedback for voice recording and speaking states
 */

'use client';

import React from 'react';
import { useVoice } from '@/contexts/voice-context';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceActivityIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceActivityIndicator({ 
  className,
  showLabel = true,
  size = 'md'
}: VoiceActivityIndicatorProps) {
  const { voiceState } = useVoice();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  if (!voiceState.isConnected) {
    return null;
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all',
          sizeClasses[size],
          voiceState.isRecording && 'bg-primary animate-pulse',
          voiceState.isSpeaking && 'bg-blue-500 animate-pulse',
          voiceState.isProcessing && 'bg-yellow-500',
          !voiceState.isRecording && !voiceState.isSpeaking && !voiceState.isProcessing && 'bg-muted'
        )}
      >
        {voiceState.isProcessing ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin text-white')} />
        ) : voiceState.isRecording ? (
          <Mic className={cn(iconSizes[size], 'text-white')} />
        ) : (
          <MicOff className={cn(iconSizes[size], 'text-muted-foreground')} />
        )}
      </div>

      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {voiceState.isProcessing && 'Processing...'}
          {voiceState.isRecording && !voiceState.isProcessing && 'Listening'}
          {voiceState.isSpeaking && !voiceState.isProcessing && 'Speaking'}
          {!voiceState.isRecording && !voiceState.isSpeaking && !voiceState.isProcessing && 'Ready'}
        </span>
      )}
    </div>
  );
}
