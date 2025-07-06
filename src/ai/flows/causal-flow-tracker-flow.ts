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
  logEntries: z.string().describe('A JSON string of an array of LogEntry objects representing the conversation.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type CausalFlowTrackerInput = z.infer<typeof CausalFlowTrackerInputSchema>;

const CausalLinkSchema = z.object({
    from: z.string().describe("The role of the agent that is the source of influence."),
    to: z.string().describe("The role of the agent that is being influenced."),
    reason: z.string().describe("A brief explanation of the nature of the influence (e.g., 'builds on idea', 'corrects flaw', 'synthesizes concepts')."),
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
  prompt: `You are an expert in analyzing team dynamics and communication flows. Your task is to analyze the following conversation log between multiple AI agents and identify the causal links of influence.

A causal link exists when one agent's message directly builds upon, corrects, questions, or synthesizes another agent's previous message.

Here is the conversation log:
{{{logEntries}}}

Identify all the clear causal links and represent them in the specified JSON output format. For each link, specify the 'from' agent role, the 'to' agent role, and a brief 'reason' for the influence. Focus only on direct, clear influences.
`,
});

const causalFlowTrackerFlow = ai.defineFlow(
  {
    name: 'causalFlowTrackerFlow',
    inputSchema: CausalFlowTrackerInputSchema,
    outputSchema: CausalFlowTrackerOutputSchema,
  },
  async (input) => {
    const model = input.model ? ai.getGenerator(input.model) : undefined;
    const {output} = await prompt(input, {model});
    return output!;
  }
);
