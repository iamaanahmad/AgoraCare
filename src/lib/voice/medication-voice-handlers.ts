/**
 * Medication Voice Handlers
 * Handles voice commands for medication management
 */

import type { Firestore } from 'firebase/firestore';
import type { ClassifiedIntent } from './intent-classifier';
import type { IntentHandler, IntentHandlerResponse } from './intent-router';
import { 
  createMedication, 
  getMedications,
  createAdherenceRecord,
  getActiveMedications 
} from '@/firebase/firestore/medications';
import { parseTimingInstructions } from '@/lib/medication-scheduler';
import { getNextScheduledDose } from '@/lib/adherence-calculator';

interface MedicationContext {
  firestore: Firestore;
  userId: string;
  profileId: string;
}

/**
 * Handler for adding medication via voice
 */
export const handleAddMedication: IntentHandler = async (
  intent: ClassifiedIntent,
  context?: MedicationContext
): Promise<IntentHandlerResponse> => {
  if (!context) {
    return {
      success: false,
      message: 'Context not provided',
    };
  }

  const { firestore, userId, profileId } = context;

  // Check if we have all required data
  const { medicationName, dosage, frequency, timing } = intent.entities;

  if (!medicationName || !dosage || !frequency) {
    return {
      success: true,
      message: "Let's add a new medication. I'll need some information.",
      requiresConversation: true,
    };
  }

  try {
    // Parse timing instructions
    const instructions = `${frequency}${timing ? ' ' + timing : ''}`;
    const parsed = parseTimingInstructions(instructions);

    // Create medication
    const medicationId = await createMedication(firestore, userId, profileId, {
      name: medicationName,
      dosage,
      frequency: parsed.frequency,
      timing: parsed.timing,
      startDate: new Date(),
      instructions,
    });

    return {
      success: true,
      message: `Great! I've added ${medicationName} (${dosage}) to your schedule. You'll take it ${frequency}.`,
      data: { medicationId },
    };
  } catch (error) {
    console.error('Error adding medication:', error);
    return {
      success: false,
      message: 'Sorry, I had trouble adding that medication. Please try again.',
    };
  }
};

/**
 * Handler for marking medication as taken via voice
 */
export const handleMarkMedicationTaken: IntentHandler = async (
  intent: ClassifiedIntent,
  context?: MedicationContext
): Promise<IntentHandlerResponse> => {
  if (!context) {
    return {
      success: false,
      message: 'Context not provided',
    };
  }

  const { firestore, userId, profileId } = context;
  const { medicationName } = intent.entities;

  try {
    // Get active medications
    const medications = await getActiveMedications(firestore, userId, profileId);

    // If medication name provided, find specific medication
    let targetMedication;
    if (medicationName) {
      targetMedication = medications.find(
        med => med.name.toLowerCase().includes(medicationName.toLowerCase())
      );

      if (!targetMedication) {
        return {
          success: false,
          message: `I couldn't find a medication called "${medicationName}". Can you try again?`,
        };
      }
    } else {
      // Get the next scheduled medication
      const nextDose = getNextScheduledDose(medications);
      if (!nextDose) {
        return {
          success: false,
          message: "You don't have any medications scheduled right now.",
        };
      }
      targetMedication = nextDose.medication;
    }

    // Create adherence record
    await createAdherenceRecord(firestore, userId, profileId, targetMedication.id, {
      medicationId: targetMedication.id,
      profileId,
      scheduledTime: new Date(),
      actualTime: new Date(),
      status: 'taken',
      method: 'voice',
    });

    return {
      success: true,
      message: `Perfect! I've marked ${targetMedication.name} as taken.`,
      data: { medicationId: targetMedication.id },
    };
  } catch (error) {
    console.error('Error marking medication as taken:', error);
    return {
      success: false,
      message: 'Sorry, I had trouble recording that. Please try again.',
    };
  }
};

/**
 * Handler for querying medications via voice
 */
export const handleMedicationQuery: IntentHandler = async (
  intent: ClassifiedIntent,
  context?: MedicationContext
): Promise<IntentHandlerResponse> => {
  if (!context) {
    return {
      success: false,
      message: 'Context not provided',
    };
  }

  const { firestore, userId, profileId } = context;

  try {
    const medications = await getActiveMedications(firestore, userId, profileId);

    if (medications.length === 0) {
      return {
        success: true,
        message: "You don't have any active medications scheduled.",
      };
    }

    // Get next scheduled dose
    const nextDose = getNextScheduledDose(medications);

    if (!nextDose) {
      return {
        success: true,
        message: `You have ${medications.length} medication${medications.length > 1 ? 's' : ''}, but none are scheduled for right now.`,
        data: { medications },
      };
    }

    const timeStr = nextDose.scheduledTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return {
      success: true,
      message: `Your next dose is ${nextDose.medication.name} (${nextDose.medication.dosage}) at ${timeStr}.`,
      data: { nextDose, medications },
    };
  } catch (error) {
    console.error('Error querying medications:', error);
    return {
      success: false,
      message: 'Sorry, I had trouble fetching your medications. Please try again.',
    };
  }
};

/**
 * Create medication voice handlers with context
 */
export function createMedicationVoiceHandlers(context: MedicationContext) {
  return {
    handleAddMedication: (intent: ClassifiedIntent) => 
      handleAddMedication(intent, context),
    handleMarkMedicationTaken: (intent: ClassifiedIntent) => 
      handleMarkMedicationTaken(intent, context),
    handleMedicationQuery: (intent: ClassifiedIntent) => 
      handleMedicationQuery(intent, context),
  };
}
