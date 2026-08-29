'use server';

/**
 * @fileOverview Manages medication reminders and adherence tracking.
 *
 * - medicationReminder - A function that handles sending medication reminders, tracking user confirmation, and adjusting future reminders.
 * - MedicationReminderInput - The input type for the medicationReminder function, including medication name, time, and user confirmation.
 * - MedicationReminderOutput - The return type for the medicationReminder function, indicating success or failure.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MedicationReminderInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  medicationName: z.string().describe('The name of the medication.'),
  dosage: z.string().describe('The dosage of the medication.'),
  time: z.string().describe('The time the medication should be taken (e.g., 8:00 AM).'),
  confirmation: z
    .boolean()
    .optional()
    .describe('Whether the patient confirmed taking the medication.'),
});
export type MedicationReminderInput = z.infer<typeof MedicationReminderInputSchema>;

const MedicationReminderOutputSchema = z.object({
  success: z.boolean().describe('Whether the reminder was successfully sent and processed.'),
  message: z.string().describe('A message indicating the status of the reminder.'),
});
export type MedicationReminderOutput = z.infer<typeof MedicationReminderOutputSchema>;

export async function medicationReminder(input: MedicationReminderInput): Promise<MedicationReminderOutput> {
  return medicationReminderFlow(input);
}

const medicationReminderPrompt = ai.definePrompt({
  name: 'medicationReminderPrompt',
  input: {schema: MedicationReminderInputSchema},
  output: {schema: MedicationReminderOutputSchema},
  prompt: `You are a helpful assistant managing medication reminders for patients.

  Patient Name: {{{patientName}}}
  Medication: {{{medicationName}}} ({{{dosage}}})
  Time: {{{time}}}
  Confirmation: {{#if confirmation}}Patient confirmed taking the medication.{{else}}Patient has not confirmed.{{/if}}

  Based on the information above, generate a reminder message for the patient. If the patient confirmed taking the medication, thank them and adjust the next reminder accordingly. If the patient did not confirm, gently remind them to take their medication.

  Return a JSON object with the success status and a message for the user.
  `,
});

const medicationReminderFlow = ai.defineFlow(
  {
    name: 'medicationReminderFlow',
    inputSchema: MedicationReminderInputSchema,
    outputSchema: MedicationReminderOutputSchema,
  },
  async input => {
    const {output} = await medicationReminderPrompt(input);
    return output!;
  }
);
