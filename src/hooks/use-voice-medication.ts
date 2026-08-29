/**
 * Voice-Enabled Medication Hook
 * Integrates voice commands with medication management
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useVoice } from '@/contexts/voice-context';
import { useFirestore } from '@/firebase';
import { classifyIntent } from '@/lib/voice/intent-classifier';
import { createDefaultIntentRouter } from '@/lib/voice/intent-router';
import { createMedicationVoiceHandlers } from '@/lib/voice/medication-voice-handlers';

interface UseVoiceMedicationOptions {
  userId: string;
  profileId: string;
  enabled?: boolean;
}

export function useVoiceMedication({
  userId,
  profileId,
  enabled = true,
}: UseVoiceMedicationOptions) {
  const { sendMessage, messages } = useVoice();
  const firestore = useFirestore();

  // Create intent router with medication handlers
  const router = createDefaultIntentRouter();

  // Set up medication handlers
  useEffect(() => {
    if (!firestore || !userId || !profileId || !enabled) return;

    const context = { firestore, userId, profileId };
    const handlers = createMedicationVoiceHandlers(context);

    // Register medication handlers
    router.registerHandler('medication_add', handlers.handleAddMedication);
    router.registerHandler('medication_taken', handlers.handleMarkMedicationTaken);
    router.registerHandler('medication_query', handlers.handleMedicationQuery);
  }, [firestore, userId, profileId, enabled]);

  /**
   * Process voice input for medication commands
   */
  const processVoiceCommand = useCallback(
    async (input: string) => {
      if (!enabled) return;

      // Classify intent
      const intent = classifyIntent(input);

      // Route to appropriate handler
      const response = await router.route(intent, {
        firestore,
        userId,
        profileId,
      });

      // Send response message
      if (response.message) {
        await sendMessage(response.message);
      }

      return response;
    },
    [enabled, firestore, userId, profileId, sendMessage]
  );

  /**
   * Process the last user message
   */
  useEffect(() => {
    if (!enabled || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      processVoiceCommand(lastMessage.content);
    }
  }, [messages, enabled, processVoiceCommand]);

  return {
    processVoiceCommand,
    isInConversation: router.isInConversation(),
    conversationProgress: router.getConversationProgress(),
    resetConversation: () => router.resetConversation(),
  };
}
