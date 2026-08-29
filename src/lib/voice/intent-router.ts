/**
 * Intent Router
 * Routes classified intents to appropriate handlers
 */

import type { ClassifiedIntent, IntentType } from './intent-classifier';
import { ConversationManager } from './conversation-manager';

export type IntentHandler = (
  intent: ClassifiedIntent,
  context?: any
) => Promise<IntentHandlerResponse>;

export interface IntentHandlerResponse {
  success: boolean;
  message: string;
  data?: any;
  requiresConversation?: boolean;
  conversationPrompt?: string;
}

export class IntentRouter {
  private handlers: Map<IntentType, IntentHandler>;
  private conversationManager: ConversationManager;
  private fallbackHandler?: IntentHandler;

  constructor() {
    this.handlers = new Map();
    this.conversationManager = new ConversationManager();
  }

  /**
   * Register an intent handler
   */
  registerHandler(intentType: IntentType, handler: IntentHandler): void {
    this.handlers.set(intentType, handler);
  }

  /**
   * Register fallback handler for unknown intents
   */
  registerFallbackHandler(handler: IntentHandler): void {
    this.fallbackHandler = handler;
  }

  /**
   * Route intent to appropriate handler
   */
  async route(
    intent: ClassifiedIntent,
    context?: any
  ): Promise<IntentHandlerResponse> {
    // Check if we're in the middle of a conversation
    if (!this.conversationManager.isComplete() && this.conversationManager.getCurrentIntent()) {
      const prompt = this.conversationManager.processResponse(intent.rawText);
      
      if (this.conversationManager.isComplete()) {
        // Conversation complete, execute the handler with collected data
        const currentIntent = this.conversationManager.getCurrentIntent();
        const collectedData = this.conversationManager.getCollectedData();
        
        if (currentIntent) {
          const handler = this.handlers.get(currentIntent.type);
          if (handler) {
            const response = await handler(
              { ...currentIntent, entities: collectedData },
              context
            );
            this.conversationManager.reset();
            return response;
          }
        }
      }

      return {
        success: true,
        message: prompt,
        requiresConversation: true,
        conversationPrompt: prompt,
      };
    }

    // Get handler for intent type
    const handler = this.handlers.get(intent.type) || this.fallbackHandler;

    if (!handler) {
      return {
        success: false,
        message: "I'm not sure how to handle that request.",
      };
    }

    try {
      const response = await handler(intent, context);

      // If handler requires conversation, start the flow
      if (response.requiresConversation) {
        const prompt = this.conversationManager.startFlow(intent, context?.profileId);
        return {
          ...response,
          conversationPrompt: prompt,
        };
      }

      return response;
    } catch (error) {
      console.error('Error handling intent:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.',
      };
    }
  }

  /**
   * Check if currently in a conversation
   */
  isInConversation(): boolean {
    return !this.conversationManager.isComplete() && 
           !!this.conversationManager.getCurrentIntent();
  }

  /**
   * Get conversation progress
   */
  getConversationProgress() {
    return this.conversationManager.getProgress();
  }

  /**
   * Reset conversation state
   */
  resetConversation(): void {
    this.conversationManager.reset();
  }
}

/**
 * Create default intent router with basic handlers
 */
export function createDefaultIntentRouter(): IntentRouter {
  const router = new IntentRouter();

  // Medication add handler
  router.registerHandler('medication_add', async (intent) => {
    return {
      success: true,
      message: "Let's add a new medication to your schedule.",
      requiresConversation: true,
    };
  });

  // Medication taken handler
  router.registerHandler('medication_taken', async (intent) => {
    return {
      success: true,
      message: 'Marking medication as taken...',
      data: { medicationName: intent.entities.medicationName },
    };
  });

  // Medication query handler
  router.registerHandler('medication_query', async (intent) => {
    return {
      success: true,
      message: 'Fetching your medication schedule...',
    };
  });

  // Appointment book handler
  router.registerHandler('appointment_book', async (intent) => {
    return {
      success: true,
      message: "Let's book an appointment for you.",
      requiresConversation: true,
    };
  });

  // Appointment query handler
  router.registerHandler('appointment_query', async (intent) => {
    return {
      success: true,
      message: 'Fetching your appointments...',
    };
  });

  // Emergency handler
  router.registerHandler('emergency', async (intent) => {
    return {
      success: true,
      message: 'Emergency mode activated. Initiating emergency protocol...',
      requiresConversation: true,
    };
  });

  // Human Escalation handler
  router.registerHandler('human_escalation', async (intent, context) => {
    if (intent.entities?.escalationReason) {
      if (context?.firestore) {
        // We have to use require/dynamic import here to avoid circular dependencies 
        // or just import it at the top of the file. I'll assume they are imported at the top.
        const { createSupportTicket } = require('@/firebase/firestore/tickets');
        const { getAgoraService } = require('@/lib/agora/agora-service');
        
        const ticketId = `ticket_${Date.now()}`;
        try {
          await createSupportTicket(context.firestore, {
             id: ticketId,
             patientId: context.profileId || 'unknown',
             patientName: 'George (Patient)',
             status: 'open',
             summary: 'Voice AI Escalation',
             reason: intent.entities.escalationReason,
             createdAt: new Date(),
          });
          
          const agoraService = getAgoraService();
          await agoraService.connect({
              appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
              channel: ticketId,
              uid: Math.floor(Math.random() * 100000)
          });
 
          return {
             success: true,
             message: 'You have been connected to a live agent. Please wait a moment while they join.',
          };
        } catch (e) {
          console.error("Failed to escalate:", e);
        }
      }
    }

    return {
      success: true,
      message: 'Escalation requested. Preparing to transfer...',
      requiresConversation: true,
    };
  });

  // General query handler
  router.registerHandler('general_query', async (intent) => {
    return {
      success: true,
      message: 'I can help you manage medications, book appointments, and handle emergencies. What would you like to do?',
    };
  });

  // Fallback handler
  router.registerFallbackHandler(async (intent) => {
    return {
      success: false,
      message: "I'm not sure what you mean. You can ask me to add medications, book appointments, or check your schedule.",
    };
  });

  return router;
}
