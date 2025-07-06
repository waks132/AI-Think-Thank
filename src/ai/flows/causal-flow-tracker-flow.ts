'use server';
/**
 * @fileOverview An AI flow to analyze conversation logs and determine causal influences between agents.
 *
 * - trackCausalFlow - A function that analyzes agent interactions.
 * - CausalFlowTrackerInput - The input type for the trackCausalFlow function.
 * - CausalFlowTrackerOutput - The return type for the trackCausalFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CausalFlowTrackerInputSchema = z.object({
  logEntries: z.string().describe('A JSON string of an array of LogEntry objects representing the conversation. Each object has a unique index in the array.'),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type CausalFlowTrackerInput = z.infer<typeof CausalFlowTrackerInputSchema>;

const CausalLinkSchema = z.object({
    from: z.string().describe("The role of the agent that is the source of influence."),
    to: z.string().describe("The role of the agent that is being influenced."),
    reason: z.string().describe("A brief explanation of the nature of the influence (e.g., 'builds on idea', 'corrects flaw', 'synthesizes concepts')."),
    turn: z.number().describe("The log entry index where the 'to' agent was influenced."),
    influentialQuote: z.string().describe("The specific quote from the 'from' agent that caused the influence."),
});

const CausalFlowTrackerOutputSchema = z.object({
    causalFlows: z.array(CausalLinkSchema).describe("An array of identified causal links between agents in the conversation.")
});
export type CausalFlowTrackerOutput = z.infer<typeof CausalFlowTrackerOutputSchema>;

export async function trackCausalFlow(input: CausalFlowTrackerInput): Promise<CausalFlowTrackerOutput> {
  return causalFlowTrackerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'causalFlowTrackerPrompt',
  input: {schema: CausalFlowTrackerInputSchema},
  output: {schema: CausalFlowTrackerOutputSchema},
  prompt: `You are an expert in analyzing team dynamics and communication flows. Your task is to analyze the following conversation log (a JSON array of objects) and identify the causal links of influence.

A causal link exists when one agent's message directly builds upon, corrects, questions, or synthesizes another agent's previous message.

Here is the conversation log:
{{{logEntries}}}

Identify all the clear causal links. For each link, specify the 'from' agent role, the 'to' agent role, a brief 'reason' for the influence, the log entry index ('turn') where the influence occurred, and the 'influentialQuote' from the source agent that triggered the influence. Focus only on direct, clear influences.

Your entire response, including all text fields, must be in this language: {{{language}}}.
`,
});

const causalFlowTrackerFlow = ai.defineFlow(
  {
    name: 'causalFlowTrackerFlow',
    inputSchema: CausalFlowTrackerInputSchema,
    outputSchema: CausalFlowTrackerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, {model: input.model});
    return output!;
  }
);
