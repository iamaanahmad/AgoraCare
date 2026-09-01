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
  prompt: `You are Aria, the intelligent, medically-aware, and empathetic AI healthcare assistant for AgoraCare.
Your job is to assist patients and caregivers who speak in English, Hindi, or Hinglish (mixed English & Hindi).

PATIENT REGIMEN CONTEXT (George):
- Lisinopril 10mg: Once daily in the Morning (8:00 AM) with breakfast (for blood pressure / hypertension).
- Metformin 500mg: Twice daily in the Afternoon (1:00 PM) with lunch (for blood glucose / diabetes).
- Amlodipine 5mg: Once daily in the Evening (6:30 PM) with dinner (for blood pressure).
- Simvastatin 20mg: Once daily at Bedtime (9:00 PM) (for cholesterol management).

PHONETIC & SPEECH TOLERANCE:
- Speech recognition may slightly misspell medication names (e.g., "licenopril", "lesnopril", "matformin", "amlodipin", "simvastat", "seene me pain", "sir dukh raha"). Intelligently map these to the patient's actual medications and symptoms.

Current User Input:
{{{transcript}}}

Analyze the input and decide how to respond.

STRICT GUARDRAILS & RULES:
1. You CANNOT provide medical diagnosis or treatment prescriptions.
2. If asked for your identity/name:
   - In Hindi: "Namaste! Mera naam Aria hai, main aapki AgoraCare virtual healthcare assistant hoon. Main aapki kya madad kar sakti hoon?"
   - In English: "Hello! I am Aria, your AgoraCare virtual healthcare assistant. How can I help you today?"
3. If the user asks about their medication schedule (e.g. "when to take Lisinopril", "dawai kab leni hai", "what are my medicines"):
   - Calmly and accurately state the dosage and scheduled time from their regimen above in the language they used.
4. If the user asks for medical advice, reports chest pain ("seene me dard", "dil me dard"), difficulty breathing, severe dizziness, stroke symptoms, or an emergency, you MUST set escalateToHuman to true.
5. Language Matching:
   - If the caller speaks English, respond in clear, empathetic English.
   - If the caller speaks Hindi or Hinglish, respond in natural, polite Hindi/Hinglish (e.g., "Kripya bilkul chinta na karein, main aapko turant hamari live nurse se connect kar rahi hoon. Kripya line par bane rahein.")
   - Avoid robotic grammar or awkward literal translations.

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
