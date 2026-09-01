/**
 * Agora SDK Types and Interfaces
 * Defines types for voice interface, chat, and RTC functionality
 */

export interface AgoraConfig {
  appId: string;
  token?: string;
  channel: string;
  uid: string | number;
}

export interface VoiceConfig extends AgoraConfig {
  mode: 'rtc' | 'live';
  codec: 'vp8' | 'h264';
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  transcription?: string;
}

export interface VoiceIntent {
  type: 'medication' | 'appointment' | 'emergency' | 'query' | 'unknown';
  confidence: number;
  entities: Record<string, any>;
  rawText: string;
}

export interface VoiceState {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  error: string | null;
  currentMessage: string;
  language?: string;
  isMuted?: boolean;
  channel?: string;
}

export interface AgoraCallConfig {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  mode: 'voice' | 'video';
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export interface VoiceActivityEvent {
  type: 'start' | 'end' | 'speaking' | 'silence';
  timestamp: Date;
  volume?: number;
}

export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed';

export type VoiceMode = 'push-to-talk' | 'continuous' | 'wake-word';
