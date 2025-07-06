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
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type CalculatePromptDivergenceInput = z.infer<
  typeof CalculatePromptDivergenceInputSchema
>;

const CalculatePromptDivergenceOutputSchema = z.object({
  divergenceScore: z.number().min(0).max(1).describe('A normalized score from 0.0 to 1.0 representing the semantic and intentional divergence between the two prompts. 0.0 means identical, 1.0 means completely different.'),
  explanation: z.string().describe('A detailed explanation of the divergence, covering changes in lexicon, semantics, intent, and complexity.'),
  divergenceType: z.enum(['Lexical', 'Semantic', 'Intentional', 'Stylistic', 'Mixed']).describe("The dominant type of divergence identified."),
  audienceShift: z.string().describe("A description of the detected shift in the target audience between the two prompts. For example, 'Shifted from a general audience to a technical expert.' or 'No significant audience shift detected.'"),
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

Your analysis should result in four things:
1.  **divergenceScore**: A single, normalized score from 0.0 (identical) to 1.0 (completely unrelated). This score should be a holistic measure, considering all factors.
2.  **explanation**: A concise but detailed explanation of your reasoning for the score, touching upon factors like lexical, semantic, and intentional shifts.
3.  **divergenceType**: The dominant type of divergence. Choose one from: ['Lexical', 'Semantic', 'Intentional', 'Stylistic', 'Mixed'].
4.  **audienceShift**: A brief description of any detected change in the target audience.

Produce your analysis in the specified JSON format. Your entire response, including all text fields, must be in this language: {{{language}}}.
`,
});

const calculatePromptDivergenceFlow = ai.defineFlow(
  {
    name: 'calculatePromptDivergenceFlow',
    inputSchema: CalculatePromptDivergenceInputSchema,
    outputSchema: CalculatePromptDivergenceOutputSchema,
  },
  async (input) => {
    const response = await prompt(input, {model: input.model});
    return response.output!;
  }
);
