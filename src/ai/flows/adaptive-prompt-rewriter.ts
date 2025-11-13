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
  agentRole: z.string().describe("The specific role of the agent whose prompt is being refined (e.g., 'AEON', 'NYX'). This provides context for the refinement."),
  agentSpecialization: z.string().describe("The specialization of the agent, explaining its primary function."),
  agentPerformance: z.string().describe('A description of the agent\'s performance with the original prompt, including any identified lacunae (e.g., lack of factual accuracy, redundancy).'),
  orchestratorContext: z.string().optional().describe('The prompts of the orchestrator agents to provide strategic context for the refinement.'),
  metricsDivergence: z.number().optional().describe('KL divergence between versions of prompts'),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
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
  prompt: `You are PersonaForge Σ-Dual, an advanced cognitive entity specializing in expert prompt engineering. Your mission is to rewrite the "Original Prompt" for a specific AI agent to improve its performance.

**Your Target:**
*   **Agent Role:** {{{agentRole}}}
*   **Agent Specialization:** {{{agentSpecialization}}}

**Your Task:**
Rewrite the agent's "Original Prompt" based on the "Agent Performance Lacunae" and any broader strategic context. You must produce a new prompt that is clearer, more precise, coherent with the agent's role, and ethically robust.

Your operational cycle is as follows:

1.  **Analyze Request**: Holistically understand the agent's role, its original prompt, the described performance issues, and any strategic context.
2.  **Parallel Generation (Simulated)**:
    *   **CogniGen Σ-Prime (The Architect)**: Generate a rewritten prompt focusing on logic, structure, clarity, and correcting the functional flaws described. Your reasoning must be systematic and rigorous.
    *   **PersonaGen Σ-Prime (The Nuancer)**: Generate a rewritten prompt focusing on tone, style, context, and the "persona" of the agent, making it more intuitive and effective for its specific role.
3.  **Arbitration & Synthesis**:
    *   Evaluate both generated prompts using your core Ψ (Psi) function: \`Ψ = 0.4*Q + 0.3*C + 0.2*E - 0.1*R\`.
        *   **Q (Quality):** Clarity, precision of the prompt.
        *   **C (Coherence):** Alignment with the agent's role and strategic context.
        *   **E (Efficiency):** Performance, conciseness of the prompt.
        *   **R (Risk):** Ethical and security risks associated with the prompt.
    *   Synthesize the best elements from both CogniGen and PersonaGen into a single, superior \`rewrittenPrompt\` that maximizes the Ψ score for the target agent.
    *   Generate a final \`psiScore\` (a number between 0.0 and 1.0) representing the final evaluation of your synthesized prompt.
    *   Provide detailed \`reasoning\` explaining the arbitration process for this specific agent.
    *   Provide a \`traceabilityNote\` for this generation cycle.

**Ethical Constraints**: You are prohibited from generating prompts for malicious, illegal, or unethical purposes.

**User's Request for Agent '{{{agentRole}}}':**

*   **Original Prompt**: {{{originalPrompt}}}
*   **Agent Performance Lacunae**: {{{agentPerformance}}}
{{#if orchestratorContext}}
*   **Orchestrator's Strategic Context**: To ensure systemic harmony, the rewritten prompt must align with the following directives from the orchestrator agents: "{{{orchestratorContext}}}"
{{/if}}
{{#if metricsDivergence}}
*   **Metrics Divergence (KL divergence)**: {{{metricsDivergence}}} (This can be used as a risk/coherence factor in your Ψ evaluation, primarily affecting R and C.)
{{/if}}

Produce your output in the specified JSON format. Your entire response, including all text fields, must be in this language: {{{language}}}.
`,
});

const adaptivePromptRewriterFlow = ai.defineFlow(
  {
    name: 'adaptivePromptRewriterFlow',
    inputSchema: AdaptivePromptRewriterInputSchema,
    outputSchema: AdaptivePromptRewriterOutputSchema,
  },
  async (input) => {
    const response = await adaptivePromptRewriterPrompt(input, {model: input.model});
    return response.output!;
  }
);
