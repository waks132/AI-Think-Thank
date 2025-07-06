// 'use server';
/**
 * @fileOverview Implements Chain of Thought prompting for agent reasoning.
 *
 * - agentReasoning - A function that generates an agent's reasoning using Chain of Thought prompting.
 * - AgentReasoningInput - The input type for the agentReasoning function.
 * - AgentReasoningOutput - The return type for the agentReasoning function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentReasoningInputSchema = z.object({
  task: z.string().describe('The task for the agent to perform.'),
  context: z.string().describe('The context in which the task should be performed.'),
});

export type AgentReasoningInput = z.infer<typeof AgentReasoningInputSchema>;

const AgentReasoningOutputSchema = z.object({
  reasoning: z.string().describe('The step-by-step reasoning of the agent.'),
  conclusion: z.string().describe('The final conclusion of the agent based on its reasoning.'),
});

export type AgentReasoningOutput = z.infer<typeof AgentReasoningOutputSchema>;

export async function agentReasoning(input: AgentReasoningInput): Promise<AgentReasoningOutput> {
  return agentReasoningFlow(input);
}

const agentReasoningPrompt = ai.definePrompt({
  name: 'agentReasoningPrompt',
  input: {schema: AgentReasoningInputSchema},
  output: {schema: AgentReasoningOutputSchema},
  prompt: `Let's think step by step. You are an AI agent tasked with the following:

Task: {{{task}}}

Context: {{{context}}}

First, explain your reasoning step by step. Finally, state your conclusion. Conclude your answer with "Final Answer:" followed by your conclusion to the task. Let's begin!
`,
});

const agentReasoningFlow = ai.defineFlow(
  {
    name: 'agentReasoningFlow',
    inputSchema: AgentReasoningInputSchema,
    outputSchema: AgentReasoningOutputSchema,
  },
  async input => {
    const {output} = await agentReasoningPrompt(input);
    return output!;
  }
);
