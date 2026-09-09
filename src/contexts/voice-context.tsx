/**
 * Voice Context Provider
 * Manages Agora voice connection state and provides voice interface functionality
 * NOW PROPERLY INTEGRATED WITH AGORA CONVERSATIONAL AI AGENT
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { getAgoraService } from '@/lib/agora';
import RTM from 'agora-rtm-sdk';
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
  voiceLanguage: 'en-IN' | 'hi-IN';
  
  // Actions
  setVoiceLanguage: (lang: 'en-IN' | 'hi-IN') => void;
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
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    error: null,
    currentMessage: '',
    language: 'en-IN',
  });

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const activeAgentIdRef = useRef<string | null>(null);
  const rtmClientRef = useRef<any>(null);
  const agoraService = getAgoraService();
  const AGENT_UID = 9999; // The agent always uses UID 9999

  /**
   * Connect to Agora voice channel
   */
  const connect = useCallback(async (channel: string, uid?: string | number) => {
    try {
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      
      if (!appId) {
        throw new Error('Agora App ID not configured');
      }

      // If already in this channel, don't reconnect
      if (voiceState.isConnected && voiceState.channel === channel) {
        return;
      }

      // Generate a dynamic numeric UID for the user
      const userUid = uid ? (typeof uid === 'number' ? uid : parseInt(uid, 10) || uid) : (Math.floor(Math.random() * 800000) + 200000);

      console.log('[Voice] Starting agent FIRST - it will manage RTC connection...');
      
      // 1. Start the Agora Conversational AI Agent FIRST
      // The agent SDK creates and manages its own RTC connection
      try {
        const agentRes = await fetch('/api/agora/agent/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelName: channel,
            userUid: userUid,
            language: voiceLanguage,
          }),
        });
        
        if (!agentRes.ok) {
          throw new Error('Agent start failed');
        }
        
        const agentData = await agentRes.json();
        activeAgentIdRef.current = agentData.session?.agentId || null;
        console.log('[Agora Conversational AI] Agent started:', agentData.session?.agentId);
        console.log('[Voice] Agent is running, now connecting user to same channel...');
      } catch (agentErr) {
        console.error('[Agora Conversational AI] Failed to start agent:', agentErr);
        throw new Error('Failed to start voice agent');
      }

      // 2. Now connect user's RTC client to the same channel
      // Fetch RTC token
      let rtcToken: string | undefined = undefined;
      let finalUid = userUid;
      
      try {
        const tokenRes = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channel)}&uid=${encodeURIComponent(userUid)}`);
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          rtcToken = tokenData.token;
          if (tokenData.uid !== undefined) {
            finalUid = tokenData.uid;
          }
        }
      } catch (tokenErr) {
        console.warn('Could not fetch dynamic token:', tokenErr);
      }

      const config: VoiceConfig = {
        appId,
        channel,
        token: rtcToken || undefined,
        uid: finalUid,
      };

      await agoraService.connect(config);
      console.log('[Voice] User joined channel, microphone should be active');

      setVoiceState(prev => ({ ...prev, isConnected: true, channel, error: null }));
      console.log('[Voice] ✅ Setup complete - agent will speak greeting shortly');
      console.log('[Voice] 🎤 After hearing greeting, speak your question and wait for response');

      // 3. RTM transcripts disabled for now
      console.log('[Voice] RTM transcripts disabled - focusing on voice conversation');
    } catch (error) {
      console.error('Failed to connect to Agora voice channel:', error);
      setVoiceState(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
      throw error;
    }
  }, [agoraService, voiceState.isConnected, voiceState.channel, voiceLanguage]);

  /**
   * Disconnect from Agora voice channel and terminate Conversational AI Agent
   */
  const disconnect = useCallback(async () => {
    try {
      const channelToClose = voiceState.channel;
      const agentToStop = activeAgentIdRef.current;

      // Disconnect RTM
      if (rtmClientRef.current) {
        try {
          await rtmClientRef.current.logout();
          rtmClientRef.current = null;
          console.log('[Agora RTM] Disconnected');
        } catch (rtmErr) {
          console.warn('[Agora RTM] Logout error:', rtmErr);
        }
      }

      // Disconnect RTC (AgoraService handles cleanup of audio tracks)
      await agoraService.disconnect();
      setVoiceState(prev => ({ ...prev, isConnected: false, channel: undefined }));

      // Terminate Agora Conversational AI Agent session
      if (channelToClose) {
        try {
          await fetch('/api/agora/agent/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelName: channelToClose,
              agentId: agentToStop,
            }),
          });
          activeAgentIdRef.current = null;
          console.log('[Agora Conversational AI] Agent stopped');
        } catch (stopErr) {
          console.warn('[Agora Conversational AI] Agent stop notice:', stopErr);
        }
      }
    } catch (error) {
      console.error('Failed to disconnect from Agora:', error);
      setVoiceState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      }));
    }
  }, [agoraService, voiceState.channel]);

  /**
   * Toggle microphone mute state
   */
  const toggleMute = useCallback(async () => {
    try {
      const isCurrentlyMuted = agoraService.isMuted();
      await agoraService.setMuted(!isCurrentlyMuted);
      setVoiceState(prev => ({ ...prev, isMuted: !isCurrentlyMuted }));
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }, [agoraService]);

  /**
   * Start recording - enables microphone for agent to hear user
   * Note: When connected to RTC, the agent automatically hears your microphone
   * This function just updates UI state to show recording is active
   */
  const startRecording = useCallback(() => {
    if (!voiceState.isConnected) {
      setVoiceState(prev => ({ ...prev, error: 'Please connect to voice channel first' }));
      return;
    }
    setVoiceState(prev => ({ ...prev, isRecording: true }));
    console.log('[Voice] Microphone active - agent is listening through RTC');
  }, [voiceState.isConnected]);

  /**
   * Stop recording - mutes microphone
   * Note: This just updates UI state. Audio still flows through RTC unless muted
   */
  const stopRecording = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isRecording: false }));
    console.log('[Voice] Recording UI stopped (audio still flows through RTC)');
  }, []);

  /**
   * Send a text message (for emergency escalation or text-based chat)
   * Note: When connected to voice agent, speak directly - don't use text chat
   */
  const sendMessage = useCallback(async (content: string) => {
    const cleanContent = content.trim();
    if (!cleanContent) return;

    // If connected to voice agent, show warning - user should speak, not type
    if (voiceState.isConnected) {
      console.warn('[Voice] Already connected to agent - speak instead of typing');
      const warningMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '💬 You are connected to the voice agent. Just speak normally - the agent can hear you through your microphone!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, warningMessage]);
      return;
    }

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: cleanContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setVoiceState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanContent }),
      });

      const data = await res.json();
      const replyText = data.response || "Main aapki madad ke liye yahan hoon. Aap kaisa mehsoos kar rahe hain?";

      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setVoiceState(prev => ({ ...prev, isProcessing: false }));

      // If AI detects emergency, automatically bridge patient into the Agora live voice room
      if (data.escalateToHuman && data.ticketId) {
        const ticketChannel = data.ticketId;
        console.log('Call escalated to live human agent. Auto-connecting to Agora channel:', ticketChannel);
        
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: '🔴 Live Nurse Bridge Active: Aapka microphone connect ho chuka hai. Jaise hi nurse Accept karengi, aap unse baat kar payenge.',
              timestamp: new Date(),
            },
          ]);
        }, 1500);

        try {
          await connect(ticketChannel);
        } catch (connErr: any) {
          console.warn('Auto-connect to Agora voice channel notice:', connErr);
          if (typeof window !== 'undefined') {
            alert('Failed to connect to Live Voice Call: ' + (connErr.message || connErr));
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackReply = 'Emergency assistance protocol activated. Transferring your details to the live care dashboard.';
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date(),
        },
      ]);
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: 'Failed to process with cloud AI' 
      }));
    }
  }, [connect, voiceState.isConnected]);

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

  // Keep a stable ref to disconnect so cleanup only runs on actual unmount
  const disconnectRef = useRef(disconnect);
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  // Cleanup on unmount - DISABLED to prevent premature agent termination
  // User must manually click "End Call" to disconnect
  /*
  useEffect(() => {
    return () => {
      disconnectRef.current();
    };
  }, []);
  */

  const value: VoiceContextType = {
    voiceState,
    messages,
    isConnected: voiceState.isConnected,
    voiceLanguage,
    setVoiceLanguage,
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
