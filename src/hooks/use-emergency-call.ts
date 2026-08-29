'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { EmergencyCallService, CallState, EmergencyCallConfig, CallMetrics } from '@/lib/emergency/emergency-call-service';
import { EmergencyContact } from '@/firebase/firestore/users';

export function useEmergencyCall() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentContact, setCurrentContact] = useState<EmergencyContact | null>(null);

  const callServiceRef = useRef<EmergencyCallService | null>(null);

  // Initialize call service
  useEffect(() => {
    callServiceRef.current = new EmergencyCallService();

    // Set up event listeners
    callServiceRef.current.on('stateChange', (state) => {
      setCallState(state);
    });

    callServiceRef.current.on('durationUpdate', (duration) => {
      setCallDuration(duration);
    });

    callServiceRef.current.on('error', (err) => {
      setError(err);
    });

    return () => {
      if (callServiceRef.current) {
        callServiceRef.current.destroy();
      }
    };
  }, []);

  /**
   * Initiate emergency call to a contact
   */
  const initiateCall = useCallback(
    async (contact: EmergencyContact, recordCall: boolean = true) => {
      if (!callServiceRef.current) {
        throw new Error('Call service not initialized');
      }

      try {
        setError(null);
        setCurrentContact(contact);

        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
        if (!appId) {
          throw new Error('Agora App ID not configured');
        }

        // Generate unique channel name for this call
        const channel = `emergency_${Date.now()}_${contact.id}`;

        // Get token from backend
        const tokenResponse = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelName: channel,
            uid: 0, // Let Agora assign UID
          }),
        });

        const tokenData = await tokenResponse.json();

        const config: EmergencyCallConfig = {
          appId,
          channel,
          token: tokenData.token,
          uid: tokenData.uid || 0,
          contactName: contact.name,
          contactPhone: contact.phoneNumber,
          recordCall,
        };

        await callServiceRef.current.initiateCall(config);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  /**
   * End the current call
   */
  const endCall = useCallback(async () => {
    if (!callServiceRef.current) return;

    try {
      await callServiceRef.current.endCall();
      setCurrentContact(null);
      setCallDuration(0);
      setIsMuted(false);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(async () => {
    if (!callServiceRef.current) return;

    try {
      const newMutedState = await callServiceRef.current.toggleMute();
      setIsMuted(newMutedState);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  /**
   * Get call metrics
   */
  const getMetrics = useCallback((): CallMetrics | null => {
    if (!callServiceRef.current) return null;
    return callServiceRef.current.getCallMetrics();
  }, []);

  /**
   * Format call duration as MM:SS
   */
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    callState,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    isMuted,
    error,
    currentContact,
    initiateCall,
    endCall,
    toggleMute,
    getMetrics,
    isCallActive: ['initiating', 'ringing', 'connected'].includes(callState),
  };
}
