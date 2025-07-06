'use server';
/**
 * @fileOverview An AI agent that automatically curates prompts by suppressing or archiving prompts that are deemed unhelpful or redundant.
 *
 * - autoCuration - A function that handles the automatic prompt curation process.
 * - AutoCurationInput - The input type for the autoCuration function.
 * - AutoCurationOutput - The return type for the autoCuration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCurationInputSchema = z.object({
  promptText: z.string().describe('The text of the prompt to be evaluated.'),
  promptId: z.string().describe('The unique identifier of the prompt.'),
  usageFrequency: z
    .number()
    .describe('The number of times the prompt has been used.'),
  successRate: z
    .number()
    .describe(
      'The rate at which the prompt has led to successful outcomes (0 to 1).'
    ),
  averageRating: z
    .number()
    .optional()
    .describe('The average rating of the prompt, if available.'),
  similarityToOtherPrompts: z
    .number()
    .optional()
    .describe(
      'A score indicating how similar this prompt is to other prompts (0 to 1).'
    ),
    model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AutoCurationInput = z.infer<typeof AutoCurationInputSchema>;

const AutoCurationOutputSchema = z.object({
  actionRecommended: z
    .enum(['archive', 'suppress', 'keep'])
    .describe(
      'The recommended action to take for the prompt: archive, suppress, or keep.'
    ),
  reason: z
    .string()
    .describe('The reasoning behind the recommended action.'),
});
export type AutoCurationOutput = z.infer<typeof AutoCurationOutputSchema>;

export async function autoCuration(input: AutoCurationInput): Promise<AutoCurationOutput> {
  return autoCurationFlow(input);
}

const autoCurationPrompt = ai.definePrompt({
  name: 'autoCurationPrompt',
  input: {schema: AutoCurationInputSchema},
  output: {schema: AutoCurationOutputSchema},
  prompt: `You are an AI prompt curator. Your task is to evaluate prompts and recommend whether they should be archived, suppressed, or kept.

  Here's the information about the prompt:
  - Prompt Text: {{{promptText}}}
  - Prompt ID: {{{promptId}}}
  - Usage Frequency: {{{usageFrequency}}}
  - Success Rate: {{{successRate}}}
  {{#if averageRating}}
  - Average Rating: {{{averageRating}}}
  {{/if}}
  {{#if similarityToOtherPrompts}}
  - Similarity to Other Prompts: {{{similarityToOtherPrompts}}}
  {{/if}}

  Consider the following factors when making your recommendation:
  - Prompts with low usage frequency and low success rates should be suppressed or archived.
  - Prompts with high similarity to other prompts may be redundant and should be considered for archiving.
  - Prompts with low average ratings (if available) should be suppressed or archived.

  Based on the above information, provide a recommendation for the prompt. Your response should follow the following format:
  {
    "actionRecommended": "<archive|suppress|keep>",
    "reason": "<reasoning for the recommendation>"
  }

  Respond with valid JSON.
`,
});

const autoCurationFlow = ai.defineFlow(
  {
    name: 'autoCurationFlow',
    inputSchema: AutoCurationInputSchema,
    outputSchema: AutoCurationOutputSchema,
  },
  async (input) => {
    const {output} = await autoCurationPrompt(input, {model: input.model});
    return output!;
  }
);
