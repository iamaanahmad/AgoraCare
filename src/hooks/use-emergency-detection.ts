'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { EmergencyMonitor, EmergencyTrigger, detectEmergency, shouldActivateEmergency, getEmergencyAction } from '@/lib/emergency/emergency-detector';

export interface EmergencyDetectionState {
  isMonitoring: boolean;
  lastTrigger: EmergencyTrigger | null;
  recentTriggers: EmergencyTrigger[];
  isEmergencyActive: boolean;
}

export function useEmergencyDetection() {
  const [state, setState] = useState<EmergencyDetectionState>({
    isMonitoring: false,
    lastTrigger: null,
    recentTriggers: [],
    isEmergencyActive: false,
  });

  const monitorRef = useRef<EmergencyMonitor | null>(null);
  const emergencyCallbackRef = useRef<((trigger: EmergencyTrigger) => void) | null>(null);

  // Initialize monitor
  useEffect(() => {
    monitorRef.current = new EmergencyMonitor();
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
      }
    };
  }, []);

  /**
   * Start monitoring for emergency keywords
   */
  const startMonitoring = useCallback((onEmergencyDetected?: (trigger: EmergencyTrigger) => void) => {
    if (!monitorRef.current) return;

    emergencyCallbackRef.current = onEmergencyDetected || null;

    monitorRef.current.start((trigger) => {
      setState(prev => ({
        ...prev,
        lastTrigger: trigger,
        recentTriggers: [...prev.recentTriggers, trigger].slice(-10),
        isEmergencyActive: shouldActivateEmergency(trigger),
      }));

      // Call external callback if provided
      if (emergencyCallbackRef.current) {
        emergencyCallbackRef.current(trigger);
      }
    });

    setState(prev => ({ ...prev, isMonitoring: true }));
  }, []);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (!monitorRef.current) return;

    monitorRef.current.stop();
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  /**
   * Process text input for emergency detection
   */
  const processText = useCallback((text: string) => {
    if (!monitorRef.current) return;
    monitorRef.current.process(text);
  }, []);

  /**
   * Manually check text for emergency without monitoring
   */
  const checkForEmergency = useCallback((text: string): EmergencyTrigger | null => {
    const trigger = detectEmergency(text);
    if (trigger && shouldActivateEmergency(trigger)) {
      setState(prev => ({
        ...prev,
        lastTrigger: trigger,
        recentTriggers: [...prev.recentTriggers, trigger].slice(-10),
        isEmergencyActive: true,
      }));
      return trigger;
    }
    return null;
  }, []);

  /**
   * Get action for a trigger
   */
  const getAction = useCallback((trigger: EmergencyTrigger) => {
    return getEmergencyAction(trigger);
  }, []);

  /**
   * Clear emergency state
   */
  const clearEmergency = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEmergencyActive: false,
      lastTrigger: null,
    }));
  }, []);

  /**
   * Clear trigger history
   */
  const clearHistory = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.clearHistory();
    }
    setState(prev => ({
      ...prev,
      recentTriggers: [],
    }));
  }, []);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    processText,
    checkForEmergency,
    getAction,
    clearEmergency,
    clearHistory,
  };
}
