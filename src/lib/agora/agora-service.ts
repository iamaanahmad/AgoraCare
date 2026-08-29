/**
 * Agora Service Wrapper
 * Manages Agora RTC SDK connection, voice channels, and error handling
 */

import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  ConnectionState as AgoraConnectionState,
  UID,
} from 'agora-rtc-sdk-ng';
import type { VoiceConfig, ConnectionState, VoiceActivityEvent } from './types';

// Enable Agora SDK logging in development
if (process.env.NODE_ENV === 'development') {
  AgoraRTC.setLogLevel(1); // 0: DEBUG, 1: INFO, 2: WARNING, 3: ERROR, 4: NONE
}

export class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private config: VoiceConfig | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;

  // Event callbacks
  private onConnectionStateChange?: (state: ConnectionState) => void;
  private onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  private onUserLeft?: (user: IAgoraRTCRemoteUser) => void;
  private onVolumeIndicator?: (volumes: { uid: UID; level: number }[]) => void;
  private onError?: (error: Error) => void;

  constructor() {
    // Initialize Agora RTC client
    this.client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    });
  }

  /**
   * Connect to Agora voice channel
   */
  async connect(config: VoiceConfig): Promise<void> {
    try {
      if (!config.appId) {
        throw new Error('Agora App ID is required');
      }

      this.config = config;
      this.setConnectionState('connecting');

      // Set up event listeners before connecting
      this.setupEventListeners();

      // Join the channel
      await this.client!.join(
        config.appId,
        config.channel,
        config.token || null,
        config.uid
      );

      // Create and publish local audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression
        AGC: true, // Automatic Gain Control
      });

      await this.client!.publish([this.localAudioTrack]);

      this.setConnectionState('connected');
      this.reconnectAttempts = 0;

      console.log('Successfully connected to Agora channel:', config.channel);
    } catch (error) {
      this.setConnectionState('failed');
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from Agora voice channel
   */
  async disconnect(): Promise<void> {
    try {
      // Stop and close local audio track
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      // Leave the channel
      if (this.client) {
        await this.client.leave();
      }

      this.setConnectionState('disconnected');
      console.log('Disconnected from Agora channel');
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Mute/unmute local microphone
   */
  async setMuted(muted: boolean): Promise<void> {
    if (!this.localAudioTrack) {
      throw new Error('Local audio track not initialized');
    }

    await this.localAudioTrack.setEnabled(!muted);
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    return this.localAudioTrack ? !this.localAudioTrack.enabled : true;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Enable volume indicator
   */
  enableVolumeIndicator(interval: number = 200): void {
    if (!this.client) return;

    this.client.enableAudioVolumeIndicator();
    
    this.client.on('volume-indicator', (volumes) => {
      if (this.onVolumeIndicator) {
        this.onVolumeIndicator(volumes);
      }
    });
  }

  /**
   * Set up event listeners for Agora client
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // Connection state changes
    this.client.on('connection-state-change', (curState: AgoraConnectionState) => {
      console.log('Agora connection state changed:', curState);
      
      switch (curState) {
        case 'CONNECTED':
          this.setConnectionState('connected');
          break;
        case 'CONNECTING':
        case 'RECONNECTING':
          this.setConnectionState('reconnecting');
          break;
        case 'DISCONNECTED':
          this.setConnectionState('disconnected');
          this.attemptReconnect();
          break;
        case 'DISCONNECTING':
          this.setConnectionState('disconnected');
          break;
      }
    });

    // User joined
    this.client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
      console.log('User joined:', user.uid);
      if (this.onUserJoined) {
        this.onUserJoined(user);
      }
    });

    // User left
    this.client.on('user-left', (user: IAgoraRTCRemoteUser) => {
      console.log('User left:', user.uid);
      if (this.onUserLeft) {
        this.onUserLeft(user);
      }
    });

    // User published audio
    this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        await this.client!.subscribe(user, mediaType);
        console.log('Subscribed to user audio:', user.uid);
        user.audioTrack?.play();
      }
    });

    // Error handling
    this.client.on('error', (error: Error) => {
      console.error('Agora client error:', error);
      this.handleError(error);
    });

    // Token privilege will expire
    this.client.on('token-privilege-will-expire', async () => {
      console.warn('Agora token will expire, renewing...');
      await this.renewToken();
    });

    // Token expired
    this.client.on('token-privilege-did-expire', async () => {
      console.error('Agora token expired');
      await this.disconnect();
      this.handleError(new Error('Agora token expired. Please reconnect.'));
    });
  }

  /**
   * Attempt to reconnect to the channel
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState('failed');
      this.handleError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        if (this.config) {
          await this.connect(this.config);
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Renew Agora token
   */
  private async renewToken(): Promise<void> {
    try {
      if (!this.config) return;

      // Call your backend to get a new token
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: this.config.channel,
          uid: this.config.uid,
        }),
      });

      const data = await response.json();
      
      if (data.token && this.client) {
        await this.client.renewToken(data.token);
        console.log('Token renewed successfully');
      }
    } catch (error) {
      console.error('Failed to renew token:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Set connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(state);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('Agora service error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Register event callbacks
   */
  on(event: 'connectionStateChange', callback: (state: ConnectionState) => void): void;
  on(event: 'userJoined', callback: (user: IAgoraRTCRemoteUser) => void): void;
  on(event: 'userLeft', callback: (user: IAgoraRTCRemoteUser) => void): void;
  on(event: 'volumeIndicator', callback: (volumes: { uid: UID; level: number }[]) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: string, callback: any): void {
    switch (event) {
      case 'connectionStateChange':
        this.onConnectionStateChange = callback;
        break;
      case 'userJoined':
        this.onUserJoined = callback;
        break;
      case 'userLeft':
        this.onUserLeft = callback;
        break;
      case 'volumeIndicator':
        this.onVolumeIndicator = callback;
        break;
      case 'error':
        this.onError = callback;
        break;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.client = null;
    this.localAudioTrack = null;
    this.config = null;
  }
}

// Singleton instance
let agoraServiceInstance: AgoraService | null = null;

/**
 * Get or create Agora service instance
 */
export function getAgoraService(): AgoraService {
  if (!agoraServiceInstance) {
    agoraServiceInstance = new AgoraService();
  }
  return agoraServiceInstance;
}
