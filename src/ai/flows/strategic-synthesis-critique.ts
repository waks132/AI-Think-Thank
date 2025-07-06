'use server';
/**
 * @fileOverview An AI flow to perform a strategic critique of a proposed solution or synthesis.
 *
 * - strategicSynthesisCritique - A function that analyzes a synthesis for weaknesses and unintended consequences.
 * - StrategicSynthesisCritiqueInput - The input type for the function.
 * - StrategicSynthesisCritiqueOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StrategicSynthesisCritiqueInputSchema = z.object({
  synthesisText: z.string().describe('The proposed synthesis or solution to be critiqued.'),
  scenario: z.string().describe('The original scenario or problem context that the synthesis addresses.'),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type StrategicSynthesisCritiqueInput = z.infer<typeof StrategicSynthesisCritiqueInputSchema>;

const StrategicSynthesisCritiqueOutputSchema = z.object({
  strengths: z.array(z.string()).describe('The key strengths and robust aspects of the proposed synthesis.'),
  weaknesses: z.array(z.string()).describe('The main structural weaknesses or vulnerabilities in the proposal.'),
  unintendedConsequences: z.array(z.string()).describe('Potential negative second-order effects or unintended consequences of implementing the synthesis.'),
  implementationChallenges: z.array(z.string()).describe('Practical challenges and obstacles that could hinder the successful implementation of the synthesis.'),
  recommendations: z.array(z.string()).describe('Actionable recommendations to strengthen the synthesis and mitigate identified risks.')
});
export type StrategicSynthesisCritiqueOutput = z.infer<typeof StrategicSynthesisCritiqueOutputSchema>;

export async function strategicSynthesisCritique(input: StrategicSynthesisCritiqueInput): Promise<StrategicSynthesisCritiqueOutput> {
  return strategicSynthesisCritiqueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategicSynthesisCritiquePrompt',
  input: {schema: StrategicSynthesisCritiqueInputSchema},
  output: {schema: StrategicSynthesisCritiqueOutputSchema},
  prompt: `You are a "Red Team" strategic analyst. Your mission is to perform a rigorous and critical analysis of a proposed solution (synthesis) for a given scenario. Your goal is not to accept the solution, but to stress-test it by identifying its hidden flaws, potential failure modes, and unintended consequences.

**Original Scenario:**
"{{{scenario}}}"

**Proposed Synthesis to Critique:**
"{{{synthesisText}}}"

**Your Analysis Must Identify:**
1.  **Strengths:** Acknowledge the strong points of the proposal to show you understand it.
2.  **Weaknesses:** Identify the fundamental structural weaknesses. Go beyond the obvious.
3.  **Unintended Consequences:** Brainstorm potential negative second-order effects that could arise from implementing this solution.
4.  **Implementation Challenges:** What are the practical, political, or social barriers to making this solution a reality?
5.  **Recommendations:** Provide actionable recommendations to mitigate the identified risks and strengthen the proposal.

Produce your analysis in the specified JSON format. Your entire response must be in this language: {{{language}}}.
`,
});

const strategicSynthesisCritiqueFlow = ai.defineFlow(
  {
    name: 'strategicSynthesisCritiqueFlow',
    inputSchema: StrategicSynthesisCritiqueInputSchema,
    outputSchema: StrategicSynthesisCritiqueOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, {model: input.model});
    return output!;
  }
);
