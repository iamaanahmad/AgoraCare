/**
 * Voice Context Provider
 * Manages Agora voice connection state and provides voice interface functionality
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAgoraService } from '@/lib/agora';
import type { 
  VoiceState, 
  ConnectionState, 
  ConversationMessage,
  VoiceConfig 
} from '@/lib/agora/types';

interface VoiceContextType {
  // State
  voiceState: VoiceState;
  messages: ConversationMessage[];
  isConnected: boolean;
  
  // Actions
  connect: (channel: string, uid?: string | number) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMute: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: ReactNode;
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    error: null,
    currentMessage: '',
  });

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const agoraService = getAgoraService();

  /**
   * Connect to Agora voice channel
   */
  const connect = useCallback(async (channel: string, uid?: string | number) => {
    try {
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      
      if (!appId) {
        throw new Error('Agora App ID not configured');
      }

      setVoiceState(prev => ({ ...prev, error: null }));

      const finalUid = uid || Math.floor(Math.random() * 100000);
      
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: channel, uid: finalUid }),
      });
      
      const { token } = await response.json();

      const config: VoiceConfig = {
        appId,
        channel,
        uid: finalUid,
        token: token || undefined,
        mode: 'rtc',
        codec: 'vp8',
      };

      // Set up event listeners
      agoraService.on('connectionStateChange', handleConnectionStateChange);
      agoraService.on('error', handleError);

      // Connect to channel
      await agoraService.connect(config);
      
      // Enable volume indicator for voice activity detection
      agoraService.enableVolumeIndicator(200);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setVoiceState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isConnected: false 
      }));
      throw error;
    }
  }, []);

  /**
   * Disconnect from Agora voice channel
   */
  const disconnect = useCallback(async () => {
    try {
      await agoraService.disconnect();
      setVoiceState({
        isConnected: false,
        isRecording: false,
        isSpeaking: false,
        isProcessing: false,
        error: null,
        currentMessage: '',
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, []);

  /**
   * Toggle microphone mute state
   */
  const toggleMute = useCallback(async () => {
    try {
      const isMuted = agoraService.isMuted();
      await agoraService.setMuted(!isMuted);
      setVoiceState(prev => ({ ...prev, isRecording: isMuted }));
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, []);

  /**
   * Start recording voice input
   */
  const startRecording = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isRecording: true, currentMessage: '' }));
  }, []);

  /**
   * Stop recording voice input
   */
  const stopRecording = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isRecording: false }));
  }, []);

  /**
   * Send a text message (for dual-mode interface)
   */
  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setVoiceState(prev => ({ ...prev, isProcessing: true }));

    try {
      // TODO: Integrate with AI service for response
      // For now, add a placeholder response
      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I received your message. AI integration coming soon.',
        timestamp: new Date(),
      };

      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setVoiceState(prev => ({ ...prev, isProcessing: false }));
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: 'Failed to send message' 
      }));
    }
  }, []);

  /**
   * Clear conversation messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Handle connection state changes
   */
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    setVoiceState(prev => ({
      ...prev,
      isConnected: state === 'connected',
      error: state === 'failed' ? 'Connection failed' : null,
    }));
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((error: Error) => {
    setVoiceState(prev => ({
      ...prev,
      error: error.message,
      isConnected: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: VoiceContextType = {
    voiceState,
    messages,
    isConnected: voiceState.isConnected,
    connect,
    disconnect,
    toggleMute,
    startRecording,
    stopRecording,
    sendMessage,
    clearMessages,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

/**
 * Hook to access voice context
 */
export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
