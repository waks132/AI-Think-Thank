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
import { queryKnowledgeBaseTool } from '@/ai/tools/knowledge-base-tool';

const AgentReasoningInputSchema = z.object({
  task: z.string().describe('The task for the agent to perform.'),
  context: z.string().describe('The context in which the task should be performed.'),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AgentReasoningInput = z.infer<typeof AgentReasoningInputSchema>;

const ReasoningStepSchema = z.object({
  step: z.number().describe('The step number in the reasoning process.'),
  cognitive_function: z.string().describe("The type of cognitive function being performed (e.g., 'Observation', 'Inference', 'Planification', 'Anticipation', 'Optimization', 'Synthesis')."),
  reasoning: z.string().describe('The detailed reasoning for this specific step.'),
  importance: z.number().min(0).max(1).describe("The cognitive weight/importance of this step on the final solution (0.0 to 1.0).")
});

const AgentReasoningOutputSchema = z.object({
  thoughtProcess: z.array(ReasoningStepSchema).describe("The agent's structured, step-by-step thought process."),
  conclusion: z.string().describe('The final conclusion or plan of action based on the reasoning process.'),
  reflexiveReview: z.string().describe("A final reflexive review of the generated plan, questioning its own assumptions or suggesting alternatives. For example: 'Could the soil analysis have occurred earlier to inform the growth chamber setup?'")
});
export type AgentReasoningOutput = z.infer<typeof AgentReasoningOutputSchema>;

export async function agentReasoning(input: AgentReasoningInput): Promise<AgentReasoningOutput> {
  return agentReasoningFlow(input);
}

const agentReasoningPrompt = ai.definePrompt({
  name: 'agentReasoningPrompt',
  tools: [queryKnowledgeBaseTool],
  input: {schema: AgentReasoningInputSchema},
  output: {schema: AgentReasoningOutputSchema},
  prompt: `You are a logical reasoning AI. Your task is to solve the given task within the provided context by thinking step-by-step.

Task: {{{task}}}
Context: {{{context}}}

Break down your thought process into a structured array of steps. For each step:
1.  Identify the primary "cognitive_function" you are using from this list: ['Observation', 'Inference', 'Planification', 'Anticipation', 'Constraint Integration', 'Optimization', 'Synthesis'].
2.  Provide the detailed 'reasoning' for that step.
3.  Assign an 'importance' score (0.0 to 1.0) representing the cognitive weight of this step on the final solution.

**Crucially, your reasoning process MUST be informed by our internal best practices. If you identify a potential gap in your knowledge, or need guidance on methodology (like multi-agent collaboration, critique, or strategic planning), you MUST use the 'queryKnowledgeBaseTool' to search for relevant frameworks, corrected analyses, or best practices (e.g., search for "FRAMEWORK-IA-CONTROL-01" or "ANALYSIS-REALITY-GAP-01"). Integrate the findings from the knowledge base into your reasoning steps.**

After detailing all the steps in 'thoughtProcess':
1.  Provide a final 'conclusion'.
2.  Provide a 'reflexiveReview' of your own plan, asking a critical question about a potential weakness or alternative approach.

Produce your entire response in valid JSON that adheres to the output schema. Your entire response, including all text fields, must be in this language: {{{language}}}.
`,
});

const agentReasoningFlow = ai.defineFlow(
  {
    name: 'agentReasoningFlow',
    inputSchema: AgentReasoningInputSchema,
    outputSchema: AgentReasoningOutputSchema,
  },
  async (input) => {
    const response = await agentReasoningPrompt(input, {model: input.model, retries: 3});
    return response.output!;
  }
);
