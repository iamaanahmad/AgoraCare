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
  const isSendingRef = React.useRef(false);
  const lastSentRef = React.useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const activeAgentIdRef = React.useRef<string | null>(null);
  const agoraService = getAgoraService();

  /**
   * Connect to Agora voice channel and spin up Agora Conversational AI Agent
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

      // Generate a dynamic numeric UID for the channel (standard Agora RTC UID)
      const userUid = uid ? (typeof uid === 'number' ? uid : parseInt(uid, 10) || uid) : (Math.floor(Math.random() * 800000) + 200000);

      // Fetch RTC token from our serverless endpoint
      let token: string | undefined = undefined;
      let finalUid = userUid;
      try {
        const tokenRes = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channel)}&uid=${encodeURIComponent(userUid)}`);
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          token = tokenData.token;
          if (tokenData.uid !== undefined) {
            finalUid = tokenData.uid;
          }
        }
      } catch (tokenErr) {
        console.warn('Could not fetch dynamic token, attempting fallback:', tokenErr);
      }

      const config: VoiceConfig = {
        appId,
        channel,
        token: token || undefined,
        uid: finalUid,
      };

      await agoraService.connect(config);
      setVoiceState(prev => ({ ...prev, isConnected: true, channel, error: null }));

      // Initialize Agora Conversational AI Engine Agent for the channel
      try {
        const agentRes = await fetch('/api/agora/agent/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelName: channel,
            userUid: finalUid,
            language: voiceLanguage,
          }),
        });
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          activeAgentIdRef.current = agentData.session?.agentId || null;
          console.log('[Agora Conversational AI] Agent session initialized:', agentData.session);
        }
      } catch (agentErr) {
        console.warn('[Agora Conversational AI] Agent initialization notice:', agentErr);
      }
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
      await agoraService.toggleMute();
      setVoiceState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }, [agoraService]);

  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  /**
   * Speak text out loud using browser speech synthesis with female Indian / Hindi accent matching
   */
  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1; // Gentle female pitch

      const voices = window.speechSynthesis.getVoices();
      // Prioritize natural female Indian voices
      const matchedVoice = voices.find(v => 
        (v.lang === 'hi-IN' || v.lang.startsWith('hi')) &&
        (v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural'))
      ) || voices.find(v =>
        (v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) &&
        (v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural'))
      ) || voices.find(v => 
        v.lang === 'hi-IN' || v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
      ) || voices.find(v => 
        v.lang === 'en-IN' || v.name.toLowerCase().includes('india')
      ) || voices.find(v => 
        v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('female')
      );

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = 'hi-IN';
      }

      setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      utterance.onend = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      };
      utterance.onerror = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      };
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  /**
   * Normalize common speech-to-text mistranscriptions for medication names
   */
  const normalizeSpeechText = (rawText: string) => {
    let text = rawText;
    text = text.replace(/lenovo\s*screen|lenovo\s*pill|licenopril|lessenopril|listen\s*o\s*pril/gi, 'Lisinopril');
    text = text.replace(/meat\s*for\s*me|met\s*for\s*me|meatformin|met\s*form/gi, 'Metformin');
    text = text.replace(/am\s*lo\s*dip\s*in|amlodipin|amlo\s*dip/gi, 'Amlodipine');
    text = text.replace(/same\s*waste|sim\s*vast\s*a\s*tin|simvast/gi, 'Simvastatin');
    return text;
  };

  /**
   * Send a text message (runs real Genkit AI Triage & speaks response)
   */
  const sendMessage = useCallback(async (content: string) => {
    const cleanContent = normalizeSpeechText(content.trim());
    if (!cleanContent) return;

    // Deduplicate / debounce identical messages within 1.5 seconds or during active sending
    const now = Date.now();
    if (
      isSendingRef.current ||
      (lastSentRef.current.text === cleanContent && now - lastSentRef.current.time < 1500)
    ) {
      console.log('Debounced duplicate message send attempt:', cleanContent);
      return;
    }

    isSendingRef.current = true;
    lastSentRef.current = { text: cleanContent, time: now };

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

      // Speak response out loud
      speakText(replyText);

      // If AI detects emergency, automatically bridge patient into the Agora live voice room
      if (data.escalateToHuman && data.ticketId) {
        const ticketChannel = data.ticketId;
        console.log('Call escalated to live human agent. Auto-connecting to Agora channel:', ticketChannel);
        
        // Add status message informing user they are connected to the live room
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
        } catch (connErr) {
          console.warn('Auto-connect to Agora voice channel notice:', connErr);
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
      speakText(fallbackReply);
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: 'Failed to process with cloud AI' 
      }));
    } finally {
      isSendingRef.current = false;
    }
  }, [speakText, connect]);

  /**
   * Start recording voice input with browser speech recognition
   */
  const startRecording = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isRecording: true, currentMessage: '' }));
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const reco = new SpeechRecognition();
          reco.lang = voiceLanguage;
          reco.continuous = false;
          reco.interimResults = true;

          let capturedText = '';
          let hasDispatched = false;

          const dispatchSpeech = () => {
            if (hasDispatched) return;
            const textToSend = capturedText.trim();
            if (textToSend) {
              hasDispatched = true;
              sendMessage(textToSend);
            }
          };

          reco.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                capturedText += ' ' + event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            const current = (capturedText + ' ' + interim).trim();
            if (current) {
              setVoiceState(prev => ({ ...prev, currentMessage: current }));
            }
          };

          reco.onerror = (event: any) => {
            console.warn('Speech recognition notice:', event.error);
            setVoiceState(prev => ({ ...prev, isRecording: false }));
          };

          reco.onend = () => {
            dispatchSpeech();
            setVoiceState(prev => ({ ...prev, isRecording: false, currentMessage: '' }));
          };

          reco.start();
          setRecognitionInstance(reco);
        } catch (e) {
          console.warn('Speech recognition start failed:', e);
          setVoiceState(prev => ({ ...prev, isRecording: false }));
        }
      } else {
        alert('Voice speech recognition is not supported in this browser. You can type in Hindi or English directly.');
        setVoiceState(prev => ({ ...prev, isRecording: false }));
      }
    }
  }, [sendMessage, voiceLanguage]);

  /**
   * Stop recording voice input
   */
  const stopRecording = useCallback(() => {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {
        // ignore
      }
    }
    setVoiceState(prev => ({ ...prev, isRecording: false }));
  }, [recognitionInstance]);

  /**
   * Clear conversation messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
