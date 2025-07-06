'use server';
/**
 * @fileOverview Adaptive Prompt Rewriter Flow. This flow automatically rewrites prompts based on agent performance to improve accuracy and effectiveness.
 *
 * - adaptivePromptRewriter - A function that handles the prompt rewriting process.
 * - AdaptivePromptRewriterInput - The input type for the adaptivePromptRewriter function.
 * - AdaptivePromptRewriterOutput - The return type for the adaptivePromptRewriter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptivePromptRewriterInputSchema = z.object({
  originalPrompt: z.string().describe('The original prompt to be rewritten.'),
  agentPerformance: z.string().describe('A description of the agent\'s performance with the original prompt, including any identified lacunae (e.g., lack of factual accuracy, redundancy).'),
  metricsDivergence: z.number().optional().describe('KL divergence between versions of prompts'),
});
export type AdaptivePromptRewriterInput = z.infer<typeof AdaptivePromptRewriterInputSchema>;

const AdaptivePromptRewriterOutputSchema = z.object({
  rewrittenPrompt: z.string().describe('The rewritten prompt, improved based on agent performance.'),
  reasoning: z.string().describe('The reasoning behind the prompt rewrite.'),
});
export type AdaptivePromptRewriterOutput = z.infer<typeof AdaptivePromptRewriterOutputSchema>;

export async function adaptivePromptRewriter(input: AdaptivePromptRewriterInput): Promise<AdaptivePromptRewriterOutput> {
  return adaptivePromptRewriterFlow(input);
}

const adaptivePromptRewriterPrompt = ai.definePrompt({
  name: 'adaptivePromptRewriterPrompt',
  input: {schema: AdaptivePromptRewriterInputSchema},
  output: {schema: AdaptivePromptRewriterOutputSchema},
  prompt: `You are an AI prompt engineer tasked with rewriting prompts to improve agent performance.

You will be given the original prompt and a description of the agent's performance with that prompt, including any identified lacunae.

Your goal is to rewrite the prompt to address these issues and improve the agent's accuracy and effectiveness.

Original Prompt: {{{originalPrompt}}}
Agent Performance: {{{agentPerformance}}}

Reasoning: Explain the changes you made to the prompt and why you made them. Be specific about how these changes will address the identified lacunae and improve performance.

Rewritten Prompt: The rewritten prompt.
`,
});

const adaptivePromptRewriterFlow = ai.defineFlow(
  {
    name: 'adaptivePromptRewriterFlow',
    inputSchema: AdaptivePromptRewriterInputSchema,
    outputSchema: AdaptivePromptRewriterOutputSchema,
  },
  async input => {
    const {output} = await adaptivePromptRewriterPrompt(input);
    return output!;
  }
);
