'use server';
/**
 * @fileOverview Calculates divergence metrics between versions of prompts using an AI model.
 *
 * - calculatePromptDivergence - A function that calculates the divergence between two prompts.
 * - CalculatePromptDivergenceInput - The input type for the calculatePromptDivergence function.
 * - CalculatePromptDivergenceOutput - The return type for the calculatePromptDivergence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculatePromptDivergenceInputSchema = z.object({
  promptVersionA: z.string().describe('The first prompt version (the original).'),
  promptVersionB: z.string().describe('The second prompt version (the new one).'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type CalculatePromptDivergenceInput = z.infer<
  typeof CalculatePromptDivergenceInputSchema
>;

const CalculatePromptDivergenceOutputSchema = z.object({
  divergenceScore: z.number().min(0).max(1).describe('A normalized score from 0.0 to 1.0 representing the semantic and intentional divergence between the two prompts. 0.0 means identical, 1.0 means completely different.'),
  explanation: z.string().describe('A detailed explanation of the divergence, covering changes in lexicon, semantics, intent, and complexity.'),
});
export type CalculatePromptDivergenceOutput = z.infer<
  typeof CalculatePromptDivergenceOutputSchema
>;

export async function calculatePromptDivergence(
  input: CalculatePromptDivergenceInput
): Promise<CalculatePromptDivergenceOutput> {
  return calculatePromptDivergenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculatePromptDivergencePrompt',
  input: {schema: CalculatePromptDivergenceInputSchema},
  output: {schema: CalculatePromptDivergenceOutputSchema},
  prompt: `You are an expert in computational linguistics and prompt engineering. Your task is to analyze two versions of a prompt and calculate their semantic and intentional divergence.

Analyze the following two prompt versions:
- **Prompt A (Original):** {{{promptVersionA}}}
- **Prompt B (New):** {{{promptVersionB}}}

Your analysis should result in two things:
1.  **divergenceScore**: A single, normalized score from 0.0 (identical) to 1.0 (completely unrelated). This score should be a holistic measure, considering factors like:
    *   **Lexical changes:** The difference in words used.
    *   **Semantic shift:** How much the core meaning or subject has changed.
    *   **Intentional shift:** Changes in the prompt's goal, target audience, or desired output format/style (e.g., from technical to pedagogical).
    *   **Complexity change:** The difference in the cognitive load required to understand or execute the prompt.
2.  **explanation**: A concise but detailed explanation of your reasoning for the score, touching upon the factors listed above.

Produce your analysis in the specified JSON format.
`,
});

const calculatePromptDivergenceFlow = ai.defineFlow(
  {
    name: 'calculatePromptDivergenceFlow',
    inputSchema: CalculatePromptDivergenceInputSchema,
    outputSchema: CalculatePromptDivergenceOutputSchema,
  },
  async (input) => {
    const model = input.model ? ai.getGenerator(input.model) : undefined;
    const {output} = await prompt(input, {model});
    return output!;
  }
);
