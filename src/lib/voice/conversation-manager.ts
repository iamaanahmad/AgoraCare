/**
 * Conversation Flow Manager
 * Manages multi-turn conversations and context
 */

import type { ConversationMessage } from '@/lib/agora/types';
import type { ClassifiedIntent, IntentType } from './intent-classifier';

export interface ConversationContext {
  currentIntent?: ClassifiedIntent;
  collectedData: Record<string, any>;
  conversationStep: number;
  isComplete: boolean;
  profileId?: string;
}

export interface ConversationFlow {
  intent: IntentType;
  steps: ConversationStep[];
  onComplete?: (data: Record<string, any>) => Promise<void>;
}

export interface ConversationStep {
  id: string;
  prompt: string;
  field: string;
  validation?: (value: string) => boolean;
  errorMessage?: string;
  optional?: boolean;
}

/**
 * Predefined conversation flows for each intent
 */
export const CONVERSATION_FLOWS: Record<IntentType, ConversationFlow> = {
  medication_add: {
    intent: 'medication_add',
    steps: [
      {
        id: 'name',
        prompt: "What's the name of the medication?",
        field: 'medicationName',
        validation: (value) => value.length > 0,
        errorMessage: 'Please provide a medication name',
      },
      {
        id: 'dosage',
        prompt: 'What dosage should you take?',
        field: 'dosage',
        validation: (value) => /\d+/.test(value),
        errorMessage: 'Please provide a valid dosage (e.g., 10mg, 2 tablets)',
      },
      {
        id: 'frequency',
        prompt: 'How often should you take it? (e.g., once daily, twice daily)',
        field: 'frequency',
      },
      {
        id: 'timing',
        prompt: 'When should you take it? (e.g., after meals, at 9am)',
        field: 'timing',
        optional: true,
      },
    ],
  },
  medication_taken: {
    intent: 'medication_taken',
    steps: [
      {
        id: 'confirmation',
        prompt: 'Which medication did you take?',
        field: 'medicationName',
        optional: true, // Can use current pending medication
      },
    ],
  },
  medication_query: {
    intent: 'medication_query',
    steps: [], // No additional data needed
  },
  appointment_book: {
    intent: 'appointment_book',
    steps: [
      {
        id: 'symptoms',
        prompt: 'What symptoms are you experiencing?',
        field: 'symptoms',
      },
      {
        id: 'specialization',
        prompt: 'What type of doctor would you like to see?',
        field: 'specialization',
        optional: true, // Can be inferred from symptoms
      },
      {
        id: 'date',
        prompt: 'When would you like to schedule the appointment?',
        field: 'preferredDate',
      },
    ],
  },
  appointment_query: {
    intent: 'appointment_query',
    steps: [],
  },
  emergency: {
    intent: 'emergency',
    steps: [
      {
        id: 'confirmation',
        prompt: 'This is an emergency. Should I call your doctor or notify your family?',
        field: 'emergencyAction',
        validation: (value) => ['doctor', 'family', 'both'].includes(value.toLowerCase()),
      },
    ],
  },
  human_escalation: {
    intent: 'human_escalation',
    steps: [
      {
        id: 'reason',
        prompt: 'I understand you need to speak with a human agent. Could you briefly tell me what this is regarding so I can transfer you to the right person?',
        field: 'escalationReason',
        optional: true,
      }
    ],
  },
  general_query: {
    intent: 'general_query',
    steps: [],
  },
  unknown: {
    intent: 'unknown',
    steps: [],
  },
};

export class ConversationManager {
  private context: ConversationContext;
  private flow?: ConversationFlow;

  constructor() {
    this.context = {
      collectedData: {},
      conversationStep: 0,
      isComplete: false,
    };
  }

  /**
   * Start a new conversation flow
   */
  startFlow(intent: ClassifiedIntent, profileId?: string): string {
    this.flow = CONVERSATION_FLOWS[intent.type];
    this.context = {
      currentIntent: intent,
      collectedData: { ...intent.entities },
      conversationStep: 0,
      isComplete: false,
      profileId,
    };

    // If no steps, mark as complete immediately
    if (!this.flow.steps || this.flow.steps.length === 0) {
      this.context.isComplete = true;
      return this.getCompletionMessage();
    }

    return this.getCurrentPrompt();
  }

  /**
   * Process user response and advance conversation
   */
  processResponse(response: string): string {
    if (!this.flow || this.context.isComplete) {
      return "I'm not sure what you're asking. Can you try again?";
    }

    const currentStep = this.flow.steps[this.context.conversationStep];
    
    // Skip optional steps if no response
    if (currentStep.optional && (!response || response.trim().length === 0)) {
      this.context.conversationStep++;
      return this.getCurrentPrompt();
    }

    // Validate response
    if (currentStep.validation && !currentStep.validation(response)) {
      return currentStep.errorMessage || 'Invalid response. Please try again.';
    }

    // Store the response
    this.context.collectedData[currentStep.field] = response;
    this.context.conversationStep++;

    // Check if conversation is complete
    if (this.context.conversationStep >= this.flow.steps.length) {
      this.context.isComplete = true;
      return this.getCompletionMessage();
    }

    return this.getCurrentPrompt();
  }

  /**
   * Get current conversation prompt
   */
  getCurrentPrompt(): string {
    if (!this.flow || this.context.isComplete) {
      return '';
    }

    const currentStep = this.flow.steps[this.context.conversationStep];
    return currentStep.prompt;
  }

  /**
   * Get completion message
   */
  private getCompletionMessage(): string {
    const messages: Record<IntentType, string> = {
      medication_add: `Great! I've added ${this.context.collectedData.medicationName} to your medication schedule.`,
      medication_taken: `Perfect! I've marked your medication as taken.`,
      medication_query: `Here are your upcoming medications...`,
      appointment_book: `I'm booking your appointment now...`,
      appointment_query: `Here are your upcoming appointments...`,
      emergency: `Initiating emergency protocol...`,
      general_query: `Let me help you with that...`,
      unknown: `I'm not sure how to help with that. Can you rephrase?`,
    };

    return messages[this.context.currentIntent?.type || 'unknown'];
  }

  /**
   * Get collected data
   */
  getCollectedData(): Record<string, any> {
    return this.context.collectedData;
  }

  /**
   * Check if conversation is complete
   */
  isComplete(): boolean {
    return this.context.isComplete;
  }

  /**
   * Get current intent
   */
  getCurrentIntent(): ClassifiedIntent | undefined {
    return this.context.currentIntent;
  }

  /**
   * Reset conversation
   */
  reset(): void {
    this.context = {
      collectedData: {},
      conversationStep: 0,
      isComplete: false,
    };
    this.flow = undefined;
  }

  /**
   * Get conversation progress
   */
  getProgress(): { current: number; total: number; percentage: number } {
    const total = this.flow?.steps.length || 0;
    const current = this.context.conversationStep;
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return { current, total, percentage };
  }
}
