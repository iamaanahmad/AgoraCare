'use server';

/**
 * @fileOverview Analyzes prescription text and generates plain language summaries.
 *
 * - prescriptionSummarizer - A function that analyzes prescription OCR text
 * - PrescriptionSummarizerInput - The input type including OCR text
 * - PrescriptionSummarizerOutput - The return type with summary and extracted medications
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PrescriptionSummarizerInputSchema = z.object({
  ocrText: z.string().describe('OCR extracted text from prescription image'),
  patientAge: z.number().optional().describe('Age of the patient'),
  patientAgeCategory: z.enum(['child', 'adult', 'elder']).optional().describe('Age category of the patient'),
  existingMedications: z.array(z.string()).optional().describe('List of medications patient is currently taking'),
});
export type PrescriptionSummarizerInput = z.infer<typeof PrescriptionSummarizerInputSchema>;

const MedicationDetailSchema = z.object({
  name: z.string().describe('Medication name (generic or brand)'),
  dosage: z.string().describe('Dosage amount and unit (e.g., "500mg", "10ml")'),
  frequency: z.string().describe('How often to take (e.g., "twice daily", "every 8 hours")'),
  duration: z.string().describe('How long to take medication (e.g., "7 days", "until finished")'),
  instructions: z.string().describe('Specific instructions (e.g., "take with food", "before bedtime")'),
  timing: z.string().optional().describe('Specific timing if mentioned (e.g., "after meals", "morning and evening")'),
});

const PrescriptionSummarizerOutputSchema = z.object({
  plainLanguageSummary: z.string().describe('Easy-to-understand summary of the prescription in simple language'),
  medications: z.array(MedicationDetailSchema).describe('List of medications with detailed information'),
  warnings: z.array(z.string()).describe('Important warnings or precautions'),
  interactions: z.array(z.string()).describe('Potential drug interactions with existing medications'),
  specialInstructions: z.array(z.string()).describe('Special instructions or important notes'),
  doctorName: z.string().optional().describe('Prescribing doctor name if found'),
  prescriptionDate: z.string().optional().describe('Prescription date if found'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the extraction'),
  missingInformation: z.array(z.string()).optional().describe('Information that could not be extracted'),
});
export type PrescriptionSummarizerOutput = z.infer<typeof PrescriptionSummarizerOutputSchema>;

export async function prescriptionSummarizer(
  input: PrescriptionSummarizerInput
): Promise<PrescriptionSummarizerOutput> {
  return prescriptionSummarizerFlow(input);
}

const prescriptionSummarizerPrompt = ai.definePrompt({
  name: 'prescriptionSummarizerPrompt',
  input: { schema: PrescriptionSummarizerInputSchema },
  output: { schema: PrescriptionSummarizerOutputSchema },
  prompt: `You are a medical prescription interpreter helping patients understand their prescriptions in plain, simple language.

Patient Information:
{{#if patientAgeCategory}}Age Category: {{{patientAgeCategory}}}{{/if}}
{{#if patientAge}}Age: {{{patientAge}}}{{/if}}
{{#if existingMedications}}Current Medications: {{{existingMedications}}}{{/if}}

Prescription OCR Text:
{{{ocrText}}}

Analyze the prescription text and provide:

1. **Plain Language Summary**: Write a clear, simple explanation that an elderly person or non-medical person can easily understand. Avoid medical jargon. Explain what the medications are for and how to take them.

2. **Medications List**: Extract each medication with:
   - Name (both generic and brand if available)
   - Dosage (amount and unit)
   - Frequency (how often)
   - Duration (how long)
   - Instructions (when and how to take)
   - Timing (specific times if mentioned)

3. **Warnings**: List any important warnings, side effects, or precautions mentioned

4. **Drug Interactions**: Check for potential interactions with existing medications if provided

5. **Special Instructions**: Any special notes like "take with food", "avoid alcohol", "store in refrigerator", etc.

6. **Doctor Information**: Extract doctor name and prescription date if available

7. **Confidence Level**: Rate your confidence in the extraction (high/medium/low) based on OCR text quality

8. **Missing Information**: Note any important information that couldn't be extracted

IMPORTANT GUIDELINES:
- Use simple, everyday language (e.g., "Take 2 pills in the morning" instead of "Administer 2 tablets QAM")
- Be specific about timing (e.g., "Take at 8 AM and 8 PM" instead of just "twice daily" when possible)
- Highlight any critical warnings in the summary
- For elderly patients, emphasize safety and clarity
- If OCR text is unclear or incomplete, note this in confidence and missing information
- Check for common drug interactions if existing medications are provided
- Convert medical abbreviations to plain language (e.g., "PO" -> "by mouth", "QD" -> "once daily")

Return ONLY a valid JSON object matching the schema. DO NOT wrap the output in markdown code blocks and DO NOT include any other text.
`,
});

const prescriptionSummarizerFlow = ai.defineFlow(
  {
    name: 'prescriptionSummarizerFlow',
    inputSchema: PrescriptionSummarizerInputSchema,
    outputSchema: PrescriptionSummarizerOutputSchema,
  },
  async (input) => {
    const { text, output } = await prescriptionSummarizerPrompt(input);
    if (!output) {
      console.error('Failed to parse AI output. Raw text:', text);
      throw new Error('AI failed to generate a valid prescription summary');
    }
    return output;
  }
);
