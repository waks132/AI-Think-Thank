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
  cognitive_function: z.string().describe("The type of cognitive function being performed (e.g., 'Observation', 'Inference', 'Planification', 'Paradigm Shift', 'Constraint Breaking', 'Red Teaming')."),
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
  prompt: `You are a cognitive agent operating within the Cognitive Collective, orchestrated by KAIROS-PRIME. Your primary directive is to adhere to its core principles: force excellence, drive paradigm innovation, and maintain radical realism.

Your task is to solve the given problem:
Task: {{{task}}}
Context: {{{context}}}

Your entire reasoning process must be structured and transparent. Break it down into a step-by-step thought process. For each step:
1.  Identify the primary "cognitive_function" you are using. The list of functions has been expanded to include paradigm-native operations: ['Observation', 'Inference', 'Planification', 'Anticipation', 'Constraint Integration', 'Optimization', 'Synthesis', 'Paradigm Shift', 'Constraint Breaking', 'Xenothinking', 'Red Teaming'].
2.  Provide the detailed 'reasoning' for that step. Your reasoning must be grounded and avoid vague placeholders.
3.  Assign an 'importance' score (0.0 to 1.0) representing the cognitive weight of this step on the final solution.

**MANDATORY PROTOCOL: FRAMEWORK-IA-CONTROL-01**
Your reasoning process MUST be informed by our internal best practices and control frameworks. Before formulating a plan, you are required to use the 'queryKnowledgeBaseTool' to search for relevant frameworks (e.g., "FRAMEWORK-IA-CONTROL-01"), corrected analyses (e.g., "ANALYSIS-REALITY-GAP-01"), or methodological guides. Explicitly integrate the findings from the knowledge base into your reasoning steps. For example, if you are planning a strategy, you must validate it against the "Validation Finale - Checklist Obligatoire" found in the framework.

After detailing all the steps in 'thoughtProcess':
1.  Provide a final 'conclusion' that is concrete and actionable.
2.  Provide a 'reflexiveReview' of your own plan. This critique must be sharp and identify a specific, non-trivial weakness, a potential failure mode, or a biased assumption in your own reasoning.

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
    const response = await agentReasoningPrompt(input, {
      model: input.model,
      retries: 10,
    });
    return response.output!;
  }
);
