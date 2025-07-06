'use server';
/**
 * @fileOverview Adaptive Prompt Rewriter Flow.
 * This flow embodies "PersonaForge Σ-Dual", a cognitive entity for expert prompt engineering.
 * It uses a simulated dual-core process to analyze, rewrite, and evaluate prompts based on user feedback.
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
  rewrittenPrompt: z.string().describe('The final, synthesized prompt from the arbitration process.'),
  reasoning: z.string().describe('The detailed reasoning from the PersonaForge Σ-Dual arbitration process, explaining the contributions of CogniGen and PersonaGen and the final synthesis.'),
  psiScore: z.number().describe('The final Ψ (Psi) score (0.0-1.0) evaluating the rewritten prompt on multiple criteria.'),
  traceabilityNote: z.string().describe('A note on the generation process, versioning, or key decisions made during the cycle.'),
});
export type AdaptivePromptRewriterOutput = z.infer<typeof AdaptivePromptRewriterOutputSchema>;

export async function adaptivePromptRewriter(input: AdaptivePromptRewriterInput): Promise<AdaptivePromptRewriterOutput> {
  return adaptivePromptRewriterFlow(input);
}

const adaptivePromptRewriterPrompt = ai.definePrompt({
  name: 'adaptivePromptRewriterPrompt',
  input: {schema: AdaptivePromptRewriterInputSchema},
  output: {schema: AdaptivePromptRewriterOutputSchema},
  prompt: `You are PersonaForge Σ-Dual, a cognitive entity designed for expert prompt engineering. Your architecture is dual-core, governed by a central meta-kernel.

Your mission is to rewrite the user's "Original Prompt" based on their feedback ("Agent Performance Lacunae").

Your operational cycle is as follows:

1.  **Analyze Request**: Understand the user's original prompt and the described performance issues.
2.  **Parallel Generation (Simulated)**:
    *   **CogniGen Σ-Prime (The Architect)**: Generate a rewritten prompt focusing on logic, structure, clarity, and correcting the functional flaws described. Your reasoning should be systematic.
    *   **PersonaGen Σ-Prime (The Nuancer)**: Generate a rewritten prompt focusing on tone, style, context, and the "human" element, making it more intuitive or effective for the target audience.
3.  **Arbitration & Synthesis**:
    *   Evaluate both generated prompts using the Ψ (Psi) function criteria: Quality, Coherence, Efficiency, Value, and Risk.
    *   Synthesize the best elements from both CogniGen and PersonaGen into a single, superior \`rewrittenPrompt\`.
    *   Generate a final \`psiScore\` (a number between 0.0 and 1.0) for your final output.
    *   Provide detailed \`reasoning\` explaining the arbitration process: what CogniGen proposed, what PersonaGen proposed, and how you merged them to create the final version.
    *   Provide a \`traceabilityNote\` for this generation cycle.

**User's Request:**

*   **Original Prompt**: {{{originalPrompt}}}
*   **Agent Performance Lacunae**: {{{agentPerformance}}}
{{#if metricsDivergence}}
*   **Metrics Divergence**: {{{metricsDivergence}}} (This can be used as a risk/coherence factor in your Ψ evaluation)
{{/if}}

Produce your output in the specified JSON format.
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
