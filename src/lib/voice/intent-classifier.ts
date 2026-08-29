/**
 * Intent Classification System
 * Classifies user voice/text input into actionable intents
 */

import type { VoiceIntent } from '@/lib/agora/types';

export type IntentType = 
  | 'medication_add'
  | 'medication_taken'
  | 'medication_query'
  | 'appointment_book'
  | 'appointment_query'
  | 'emergency'
  | 'human_escalation'
  | 'general_query'
  | 'unknown';

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number;
  entities: Record<string, any>;
  rawText: string;
  action?: string;
  parameters?: Record<string, any>;
}

/**
 * Intent patterns for matching user input
 */
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  medication_add: [
    /add (a |my )?medication/i,
    /new medication/i,
    /take (a )?new (medicine|pill|drug)/i,
    /start taking/i,
    /prescribed (a |me )?/i,
  ],
  medication_taken: [
    /(i |i've |i have )?taken (my |the )?/i,
    /(mark|log) (as )?taken/i,
    /done (with|taking)/i,
    /finished (my |the )?/i,
    /took (my |the )?/i,
  ],
  medication_query: [
    /what('s| is) (my )?next (dose|medication|pill)/i,
    /when (do i|should i) take/i,
    /medication (schedule|list)/i,
    /show (my )?medications/i,
    /what (medicine|medication|pills) (do i|should i)/i,
  ],
  appointment_book: [
    /book (an )?appointment/i,
    /schedule (a |an )?appointment/i,
    /see (a |the )?doctor/i,
    /make (an )?appointment/i,
    /i need to see/i,
  ],
  appointment_query: [
    /when (is|'s) (my )?next appointment/i,
    /show (my )?appointments/i,
    /appointment (schedule|list)/i,
    /do i have (an )?appointment/i,
  ],
  emergency: [
    /\b(emergency|911|help me|can't breathe|chest pain|heart attack|stroke)\b/i,
    /\b(call ambulance|need ambulance|medical emergency)\b/i,
    /\b(severe pain|extreme pain|unbearable pain)\b/i,
    /\b(call (the |my )?doctor|need (a |the )?doctor|see doctor (now|immediately))\b/i,
    /\b(urgent|urgently need|need help (now|immediately))\b/i,
    /\b(something('s| is) wrong|not feeling (well|good)|feel (terrible|awful))\b/i,
    /\b(help|assistance|support)\b/i,
    /\b(contact (my )?family|call (my )?(son|daughter|spouse|family))\b/i,
  ],
  human_escalation: [
    /\b(human|agent|nurse|operator|someone else)\b/i,
    /\b(transfer (me|call)|talk to (a |an )?(real person|human))\b/i,
    /\b(doctor se baat karni hai|nurse ko phone do|madad chahiye)\b/i,
    /\b(nahi samjhe|you don't understand|stop)\b/i,
    /\b(pain is too much|bohot dard hai|too much pain)\b/i,
  ],
  general_query: [
    /what can you do/i,
    /help/i,
    /how (do|does)/i,
    /tell me about/i,
  ],
  unknown: [],
};

/**
 * Entity extraction patterns
 */
const ENTITY_PATTERNS = {
  medicationName: /(?:medication|medicine|pill|drug)\s+(?:called\s+)?([a-z]+(?:\s+[a-z]+)?)/i,
  time: /(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  frequency: /(once|twice|three times|daily|weekly|monthly|every\s+\d+\s+(?:hours?|days?))/i,
  dosage: /(\d+(?:\.\d+)?\s*(?:mg|ml|tablets?|pills?|capsules?))/i,
  timing: /(before|after|with)\s+(?:meals?|breakfast|lunch|dinner|food)/i,
  symptoms: /(?:i have|experiencing|feeling)\s+([a-z\s,]+)/i,
  specialization: /(cardiologist|dermatologist|dentist|pediatrician|general practitioner|gp)/i,
};

/**
 * Classify user input into an intent
 */
export function classifyIntent(input: string): ClassifiedIntent {
  const normalizedInput = input.trim().toLowerCase();
  
  // Check each intent pattern
  for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedInput)) {
        const entities = extractEntities(normalizedInput);
        
        return {
          type: intentType as IntentType,
          confidence: calculateConfidence(normalizedInput, pattern),
          entities,
          rawText: input,
          action: getActionForIntent(intentType as IntentType),
          parameters: entities,
        };
      }
    }
  }

  // Default to unknown intent
  return {
    type: 'unknown',
    confidence: 0,
    entities: {},
    rawText: input,
  };
}

/**
 * Extract entities from user input
 */
function extractEntities(input: string): Record<string, any> {
  const entities: Record<string, any> = {};

  for (const [entityName, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const match = input.match(pattern);
    if (match && match[1]) {
      entities[entityName] = match[1].trim();
    }
  }

  return entities;
}

/**
 * Calculate confidence score for intent match
 */
function calculateConfidence(input: string, pattern: RegExp): number {
  const match = input.match(pattern);
  if (!match) return 0;

  // Base confidence on match length relative to input length
  const matchLength = match[0].length;
  const inputLength = input.length;
  const ratio = matchLength / inputLength;

  // Confidence between 0.6 and 1.0
  return Math.min(0.6 + (ratio * 0.4), 1.0);
}

/**
 * Get action string for intent type
 */
function getActionForIntent(intentType: IntentType): string {
  const actions: Record<IntentType, string> = {
    medication_add: 'add_medication',
    medication_taken: 'mark_medication_taken',
    medication_query: 'query_medications',
    appointment_book: 'book_appointment',
    appointment_query: 'query_appointments',
    emergency: 'trigger_emergency',
    human_escalation: 'escalate_to_human',
    general_query: 'handle_query',
    unknown: 'handle_unknown',
  };

  return actions[intentType];
}

/**
 * Validate if intent has required entities
 */
export function validateIntent(intent: ClassifiedIntent): boolean {
  const requiredEntities: Record<IntentType, string[]> = {
    medication_add: [], // Will be collected through conversation
    medication_taken: [], // Can work without specific medication name
    medication_query: [],
    appointment_book: [], // Will be collected through conversation
    appointment_query: [],
    emergency: [],
    human_escalation: [],
    general_query: [],
    unknown: [],
  };

  const required = requiredEntities[intent.type] || [];
  return required.every(entity => entity in intent.entities);
}
