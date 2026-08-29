'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { EmergencyContact } from '@/firebase/firestore/users';
import { EmergencyTrigger } from '@/lib/emergency/emergency-detector';
import { EmergencyStatus } from '@/components/emergency/emergency-status-indicator';

interface EmergencyEvent {
  id: string;
  profileId: string;
  triggeredBy: 'voice' | 'button' | 'auto';
  timestamp: Date;
  type: 'call-doctor' | 'notify-family' | 'emergency-services';
  status: EmergencyStatus;
  contactsNotified: string[];
  callDuration?: number;
  notes?: string;
  trigger?: EmergencyTrigger;
}

interface EmergencyContextType {
  // State
  isEmergencyActive: boolean;
  currentEvent: EmergencyEvent | null;
  emergencyStatus: EmergencyStatus;
  recentEvents: EmergencyEvent[];

  // Actions
  activateEmergency: (trigger?: EmergencyTrigger, triggeredBy?: 'voice' | 'button') => void;
  deactivateEmergency: () => void;
  callDoctor: (profileId: string, contacts: EmergencyContact[]) => Promise<void>;
  notifyFamily: (profileId: string, contacts: EmergencyContact[]) => Promise<void>;
  updateEventStatus: (status: EmergencyStatus, notes?: string) => void;
  getRecentEvents: () => EmergencyEvent[];
  clearHistory: () => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

interface EmergencyProviderProps {
  children: ReactNode;
}

export function EmergencyProvider({ children }: EmergencyProviderProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<EmergencyEvent | null>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>('idle');
  const [recentEvents, setRecentEvents] = useState<EmergencyEvent[]>([]);

  /**
   * Activate emergency mode
   */
  const activateEmergency = useCallback(
    (trigger?: EmergencyTrigger, triggeredBy: 'voice' | 'button' = 'button') => {
      const event: EmergencyEvent = {
        id: `emergency_${Date.now()}`,
        profileId: '', // Will be set when action is taken
        triggeredBy,
        timestamp: new Date(),
        type: 'call-doctor', // Default, will be updated based on action
        status: 'triggered',
        contactsNotified: [],
        trigger,
      };

      setCurrentEvent(event);
      setIsEmergencyActive(true);
      setEmergencyStatus('triggered');

      // Play alert sound
      playEmergencyAlert();
    },
    []
  );

  /**
   * Deactivate emergency mode
   */
  const deactivateEmergency = useCallback(() => {
    if (currentEvent) {
      // Add to history
      setRecentEvents(prev => [
        { ...currentEvent, status: emergencyStatus },
        ...prev.slice(0, 9), // Keep last 10 events
      ]);
    }

    setIsEmergencyActive(false);
    setCurrentEvent(null);
    setEmergencyStatus('idle');
  }, [currentEvent, emergencyStatus]);

  /**
   * Call doctor action
   */
  const callDoctor = useCallback(
    async (profileId: string, contacts: EmergencyContact[]) => {
      if (!currentEvent) return;

      const updatedEvent: EmergencyEvent = {
        ...currentEvent,
        profileId,
        type: 'call-doctor',
        status: 'calling',
      };

      setCurrentEvent(updatedEvent);
      setEmergencyStatus('calling');

      try {
        // Find primary doctor contact
        const doctorContact = contacts.find(c => c.priority === 1);

        if (!doctorContact) {
          throw new Error('No primary contact found');
        }

        // TODO: Integrate with Agora RTC for actual call
        // For now, simulate call initiation
        console.log('Initiating call to:', doctorContact);

        // Simulate call duration
        await new Promise(resolve => setTimeout(resolve, 2000));

        setEmergencyStatus('completed');
        setCurrentEvent(prev =>
          prev ? { ...prev, status: 'completed', callDuration: 120 } : null
        );
      } catch (error) {
        console.error('Error calling doctor:', error);
        setEmergencyStatus('failed');
        setCurrentEvent(prev =>
          prev
            ? { ...prev, status: 'failed', notes: 'Failed to initiate call' }
            : null
        );
      }
    },
    [currentEvent]
  );

  /**
   * Notify family action
   */
  const notifyFamily = useCallback(
    async (profileId: string, contacts: EmergencyContact[]) => {
      if (!currentEvent) return;

      const updatedEvent: EmergencyEvent = {
        ...currentEvent,
        profileId,
        type: 'notify-family',
        status: 'notifying',
      };

      setCurrentEvent(updatedEvent);
      setEmergencyStatus('notifying');

      try {
        // Notify all emergency contacts
        const notificationPromises = contacts.map(async contact => {
          // TODO: Integrate with SMS/Push notification service
          console.log('Notifying contact:', contact);
          return contact.id;
        });

        const notifiedIds = await Promise.all(notificationPromises);

        setEmergencyStatus('completed');
        setCurrentEvent(prev =>
          prev ? { ...prev, status: 'completed', contactsNotified: notifiedIds } : null
        );
      } catch (error) {
        console.error('Error notifying family:', error);
        setEmergencyStatus('failed');
        setCurrentEvent(prev =>
          prev
            ? { ...prev, status: 'failed', notes: 'Failed to notify contacts' }
            : null
        );
      }
    },
    [currentEvent]
  );

  /**
   * Update event status
   */
  const updateEventStatus = useCallback((status: EmergencyStatus, notes?: string) => {
    setEmergencyStatus(status);
    setCurrentEvent(prev => (prev ? { ...prev, status, notes } : null));
  }, []);

  /**
   * Get recent emergency events
   */
  const getRecentEvents = useCallback(() => {
    return recentEvents;
  }, [recentEvents]);

  /**
   * Clear event history
   */
  const clearHistory = useCallback(() => {
    setRecentEvents([]);
  }, []);

  /**
   * Play emergency alert sound
   */
  const playEmergencyAlert = () => {
    try {
      const audio = new Audio('/sounds/emergency-alert.mp3');
      audio.play().catch(err => console.error('Error playing alert:', err));
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  };

  const value: EmergencyContextType = {
    isEmergencyActive,
    currentEvent,
    emergencyStatus,
    recentEvents,
    activateEmergency,
    deactivateEmergency,
    callDoctor,
    notifyFamily,
    updateEventStatus,
    getRecentEvents,
    clearHistory,
  };

  return <EmergencyContext.Provider value={value}>{children}</EmergencyContext.Provider>;
}

/**
 * Hook to access emergency context
 */
export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
}
