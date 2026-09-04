/**
 * Emergency Call Service
 * Handles emergency voice calls using Agora RTC
 */

import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-sdk-ng';

export type CallState = 
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'failed';

export interface EmergencyCallConfig {
  appId: string;
  channel: string;
  token?: string;
  uid: UID;
  contactName: string;
  contactPhone: string;
  recordCall?: boolean;
}

export interface CallMetrics {
  duration: number;
  startTime: Date;
  endTime?: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  audioLevel: number;
}

export class EmergencyCallService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private callState: CallState = 'idle';
  private callStartTime: Date | null = null;
  private callDuration: number = 0;
  private callTimer: NodeJS.Timeout | null = null;
  private isRecording: boolean = false;

  // Event callbacks
  private onStateChange?: (state: CallState) => void;
  private onDurationUpdate?: (duration: number) => void;
  private onRemoteUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  private onRemoteUserLeft?: (user: IAgoraRTCRemoteUser) => void;
  private onError?: (error: Error) => void;

  constructor() {
    this.client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    });
  }

  /**
   * Initiate emergency call
   */
  async initiateCall(config: EmergencyCallConfig): Promise<void> {
    try {
      this.setState('initiating');

      // Set up event listeners
      this.setupEventListeners();

      // Join the channel
      await this.client!.join(
        config.appId,
        config.channel,
        config.token || null,
        config.uid
      );

      // Create local audio track with optimized settings for voice calls
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression
        AGC: true, // Automatic Gain Control
      });

      // Publish local audio
      await this.client!.publish([this.localAudioTrack]);

      this.setState('ringing');

      // Start call recording if enabled
      if (config.recordCall) {
        await this.startRecording(config.channel);
      }

      console.log('Emergency call initiated to:', config.contactName);
    } catch (error) {
      this.setState('failed');
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * End the call
   */
  async endCall(): Promise<void> {
    try {
      // Stop recording if active
      if (this.isRecording) {
        await this.stopRecording();
      }

      // Stop call timer
      if (this.callTimer) {
        clearInterval(this.callTimer);
        this.callTimer = null;
      }

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

      this.setState('ended');
      console.log('Emergency call ended. Duration:', this.callDuration, 'seconds');
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Toggle mute
   */
  async toggleMute(): Promise<boolean> {
    if (!this.localAudioTrack) {
      throw new Error('No active audio track');
    }

    const isMuted = !this.localAudioTrack.enabled;
    await this.localAudioTrack.setEnabled(isMuted);
    return !isMuted;
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.localAudioTrack ? !this.localAudioTrack.enabled : true;
  }

  /**
   * Get current call state
   */
  getCallState(): CallState {
    return this.callState;
  }

  /**
   * Get call duration in seconds
   */
  getCallDuration(): number {
    return this.callDuration;
  }

  /**
   * Get call metrics
   */
  getCallMetrics(): CallMetrics | null {
    if (!this.callStartTime) return null;

    return {
      duration: this.callDuration,
      startTime: this.callStartTime,
      endTime: this.callState === 'ended' ? new Date() : undefined,
      quality: this.calculateCallQuality(),
      audioLevel: this.getAudioLevel(),
    };
  }

  /**
   * Start call recording
   */
  private async startRecording(channel: string): Promise<void> {
    try {
      // Call backend API to start cloud recording
      const response = await fetch('/api/emergency/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });

      if (!response.ok) {
        throw new Error('Failed to start recording');
      }

      this.isRecording = true;
      console.log('Call recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      // Don't fail the call if recording fails
    }
  }

  /**
   * Stop call recording
   */
  private async stopRecording(): Promise<void> {
    try {
      const response = await fetch('/api/emergency/recording/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to stop recording');
      }

      this.isRecording = false;
      console.log('Call recording stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // Remote user joined (call answered)
    this.client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
      console.log('Remote user joined (call answered):', user.uid);
      
      this.setState('connected');
      this.startCallTimer();

      if (this.onRemoteUserJoined) {
        this.onRemoteUserJoined(user);
      }
    });

    // Remote user left (call ended by other party)
    this.client.on('user-left', (user: IAgoraRTCRemoteUser) => {
      console.log('Remote user left:', user.uid);
      
      if (this.onRemoteUserLeft) {
        this.onRemoteUserLeft(user);
      }

      // End the call
      this.endCall();
    });

    // Remote user published audio
    this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        try {
          const remoteTrack = await this.client!.subscribe(user, mediaType);
          console.log('Subscribed to remote audio successfully:', user.uid);
          if (remoteTrack) {
            remoteTrack.play();
          } else if (user.audioTrack) {
            user.audioTrack.play();
          }
        } catch (subErr) {
          console.error('Error subscribing to remote audio track:', subErr);
        }
      }
    });

    // Connection state changes
    this.client.on('connection-state-change', (curState) => {
      console.log('Call connection state:', curState);
      
      if (curState === 'DISCONNECTED' && this.callState === 'connected') {
        this.endCall();
      }
    });

    // Error handling
    this.client.on('error', (error: Error) => {
      console.error('Emergency call error:', error);
      this.handleError(error);
    });
  }

  /**
   * Start call duration timer
   */
  private startCallTimer(): void {
    this.callStartTime = new Date();
    this.callDuration = 0;

    this.callTimer = setInterval(() => {
      this.callDuration++;
      if (this.onDurationUpdate) {
        this.onDurationUpdate(this.callDuration);
      }
    }, 1000);
  }

  /**
   * Calculate call quality based on network stats
   */
  private calculateCallQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    // TODO: Implement actual quality calculation based on network stats
    // For now, return a default value
    return 'good';
  }

  /**
   * Get current audio level
   */
  private getAudioLevel(): number {
    // TODO: Implement actual audio level detection
    return 0;
  }

  /**
   * Set call state and notify listeners
   */
  private setState(state: CallState): void {
    this.callState = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('Emergency call service error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Register event callbacks
   */
  on(event: 'stateChange', callback: (state: CallState) => void): void;
  on(event: 'durationUpdate', callback: (duration: number) => void): void;
  on(event: 'remoteUserJoined', callback: (user: IAgoraRTCRemoteUser) => void): void;
  on(event: 'remoteUserLeft', callback: (user: IAgoraRTCRemoteUser) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: string, callback: any): void {
    switch (event) {
      case 'stateChange':
        this.onStateChange = callback;
        break;
      case 'durationUpdate':
        this.onDurationUpdate = callback;
        break;
      case 'remoteUserJoined':
        this.onRemoteUserJoined = callback;
        break;
      case 'remoteUserLeft':
        this.onRemoteUserLeft = callback;
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
    this.endCall();
    this.client = null;
    this.localAudioTrack = null;
  }
}
