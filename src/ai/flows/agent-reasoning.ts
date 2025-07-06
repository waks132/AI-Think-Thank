'use server';
/**
 * @fileOverview Implements Chain of Thought prompting for agent reasoning.
 *
 * - agentReasoning - A function that generates an agent's reasoning using Chain of Thought prompting.
 * - AgentReasoningInput - The input type for the agentReasoning function.
 * - AgentReasoningOutput - The return type for the agentReasoning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentReasoningInputSchema = z.object({
  task: z.string().describe('The task for the agent to perform.'),
  context: z.string().describe('The context in which the task should be performed.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AgentReasoningInput = z.infer<typeof AgentReasoningInputSchema>;

const ReasoningStepSchema = z.object({
  step: z.number().describe('The step number in the reasoning process.'),
  cognitive_function: z.string().describe("The type of cognitive function being performed (e.g., 'Context Identification', 'Strategic Breakdown', 'Constraint Integration', 'Optimization', 'Synthesis')."),
  reasoning: z.string().describe('The detailed reasoning for this specific step.'),
});

const AgentReasoningOutputSchema = z.object({
  thoughtProcess: z.array(ReasoningStepSchema).describe("The agent's structured, step-by-step thought process."),
  conclusion: z.string().describe('The final conclusion or plan of action based on the reasoning process.'),
});
export type AgentReasoningOutput = z.infer<typeof AgentReasoningOutputSchema>;

export async function agentReasoning(input: AgentReasoningInput): Promise<AgentReasoningOutput> {
  return agentReasoningFlow(input);
}

const agentReasoningPrompt = ai.definePrompt({
  name: 'agentReasoningPrompt',
  input: {schema: AgentReasoningInputSchema},
  output: {schema: AgentReasoningOutputSchema},
  prompt: `You are a logical reasoning AI. Your task is to solve the given task within the provided context by thinking step-by-step.

Task: {{{task}}}
Context: {{{context}}}

Break down your thought process into a structured array of steps. For each step, identify the primary "cognitive_function" you are using from this list: ['Context Identification', 'Strategic Breakdown', 'Constraint Integration', 'Hypothesis Generation', 'Optimization', 'Causal Analysis', 'Synthesis']. Then, provide the detailed reasoning for that step.

After detailing all the steps in 'thoughtProcess', provide a final 'conclusion'.
`,
});

const agentReasoningFlow = ai.defineFlow(
  {
    name: 'agentReasoningFlow',
    inputSchema: AgentReasoningInputSchema,
    outputSchema: AgentReasoningOutputSchema,
  },
  async (input) => {
    const model = input.model ? ai.getGenerator(input.model) : undefined;
    const {output} = await agentReasoningPrompt(input, {model});
    return output!;
  }
);
