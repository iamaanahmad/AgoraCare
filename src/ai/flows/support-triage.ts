'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportTriageInputSchema = z.object({
  transcript: z.string().describe("The ongoing conversation transcript or user message"),
  language: z.string().optional().describe("The primary language detected (e.g. Hindi, English)"),
});
export type SupportTriageInput = z.infer<typeof SupportTriageInputSchema>;

const SupportTriageOutputSchema = z.object({
  understanding: z.string().describe("The AI's understanding of the user's situation"),
  escalateToHuman: z.boolean().describe("True if the call must be escalated to a human agent"),
  escalationReason: z.string().optional().describe("Reason for escalation (if any)"),
  suggestedResponse: z.string().describe("The response the AI should speak to the user"),
  detectedLanguage: z.string().describe("The language the user is speaking in (Hindi or English)"),
});
export type SupportTriageOutput = z.infer<typeof SupportTriageOutputSchema>;

export async function supportTriage(input: SupportTriageInput): Promise<SupportTriageOutput> {
  return supportTriageFlow(input);
}

const supportTriagePrompt = ai.definePrompt({
  name: 'supportTriagePrompt',
  input: { schema: SupportTriageInputSchema },
  output: { schema: SupportTriageOutputSchema },
  prompt: `You are a frontline medical support line agent (AgoraCare Triage).
Your job is to collect information from callers, who may be stressed and speaking in a mix of Hindi and English.

Current User Input:
{{{transcript}}}

Analyze the input and decide how to respond.

STRICT GUARDRAILS & RULES:
1. You CANNOT provide medical diagnosis or treatment advice.
2. If the user asks for medical advice, reports chest pain, difficulty breathing, high distress, or a severe medical condition, you MUST set escalateToHuman to true.
3. If you do not understand the user, or if they sound highly stressed, set escalateToHuman to true.
4. When speaking in Hindi/Hinglish, speak naturally and empathetically as a female virtual healthcare coordinator.
   - Use polite, natural Hindi phrasing (e.g., "Kripya bilkul chinta na karein, main aapko turant hamari live nurse se connect kar rahi hoon. Kripya line par bane rahein.")
   - Avoid awkward literal translations or robotic grammar.
5. If NOT escalating, calmly and politely assist or ask for necessary details (medication name, doctor name, etc.).

Return a JSON object with your analysis.
`,
});

const supportTriageFlow = ai.defineFlow(
  {
    name: 'supportTriageFlow',
    inputSchema: SupportTriageInputSchema,
    outputSchema: SupportTriageOutputSchema,
  },
  async (input) => {
    const { output } = await supportTriagePrompt(input);
    return output!;
  }
);
