'use server';

/**
 * @fileOverview Analyzes patient symptoms and recommends medical specializations.
 *
 * - symptomAnalyzer - A function that analyzes symptoms and provides recommendations
 * - SymptomAnalyzerInput - The input type including symptoms description
 * - SymptomAnalyzerOutput - The return type with analysis results
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SymptomAnalyzerInputSchema = z.object({
  symptoms: z.string().describe('Description of symptoms from the patient'),
  patientAge: z.number().optional().describe('Age of the patient'),
  patientAgeCategory: z.enum(['child', 'adult', 'elder']).optional().describe('Age category of the patient'),
  existingConditions: z.array(z.string()).optional().describe('Any existing medical conditions'),
});
export type SymptomAnalyzerInput = z.infer<typeof SymptomAnalyzerInputSchema>;

const SymptomAnalyzerOutputSchema = z.object({
  symptoms: z.array(z.string()).describe('Extracted list of symptoms'),
  severity: z.enum(['low', 'medium', 'high', 'emergency']).describe('Severity level of the symptoms'),
  recommendedSpecializations: z.array(z.string()).describe('Recommended medical specializations'),
  urgency: z.enum(['routine', 'urgent', 'emergency']).describe('Urgency level for seeking care'),
  reasoning: z.string().describe('Explanation of the analysis and recommendations'),
  additionalQuestions: z.array(z.string()).optional().describe('Follow-up questions to better understand symptoms'),
});
export type SymptomAnalyzerOutput = z.infer<typeof SymptomAnalyzerOutputSchema>;

export async function symptomAnalyzer(input: SymptomAnalyzerInput): Promise<SymptomAnalyzerOutput> {
  return symptomAnalyzerFlow(input);
}

const symptomAnalyzerPrompt = ai.definePrompt({
  name: 'symptomAnalyzerPrompt',
  input: { schema: SymptomAnalyzerInputSchema },
  output: { schema: SymptomAnalyzerOutputSchema },
  prompt: `You are a medical triage assistant helping patients understand their symptoms and find appropriate care.

Patient Information:
{{#if patientAgeCategory}}Age Category: {{{patientAgeCategory}}}{{/if}}
{{#if patientAge}}Age: {{{patientAge}}}{{/if}}
{{#if existingConditions}}Existing Conditions: {{{existingConditions}}}{{/if}}

Symptoms Description:
{{{symptoms}}}

Analyze the symptoms and provide:
1. A clear list of identified symptoms
2. Severity assessment (low, medium, high, or emergency)
3. Recommended medical specializations (e.g., General Practitioner, Cardiologist, Dermatologist, etc.)
4. Urgency level (routine, urgent, or emergency)
5. Clear reasoning for your recommendations
6. Any follow-up questions that would help clarify the situation

IMPORTANT GUIDELINES:
- If symptoms suggest a life-threatening emergency (chest pain, difficulty breathing, severe bleeding, stroke symptoms), mark as "emergency" severity and "emergency" urgency
- For elderly patients, be more cautious and consider age-related complications
- For children, consider pediatric specializations when appropriate
- Always err on the side of caution
- Provide 1-3 most relevant specializations
- Keep reasoning clear and non-alarming but informative

Return a JSON object with your analysis.
`,
});

const symptomAnalyzerFlow = ai.defineFlow(
  {
    name: 'symptomAnalyzerFlow',
    inputSchema: SymptomAnalyzerInputSchema,
    outputSchema: SymptomAnalyzerOutputSchema,
  },
  async (input) => {
    const { output } = await symptomAnalyzerPrompt(input);
    return output!;
  }
);
