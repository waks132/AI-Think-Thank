'use server';
/**
 * @fileOverview An AI flow to generate a cognitive heatmap by identifying semantic activation zones in a text.
 *
 * - generateCognitiveHeatmap - A function that generates the heatmap data.
 * - CognitiveHeatmapInput - The input type for the generateCognitiveHeatmap function.
 * - CognitiveHeatmapOutput - The return type for the generateCognitiveHeatmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CognitiveHeatmapInputSchema = z.object({
  text: z.string().describe('The text to be analyzed.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type CognitiveHeatmapInput = z.infer<typeof CognitiveHeatmapInputSchema>;

const HeatmapWordSchema = z.object({
  word: z.string().describe("A word from the original text."),
  weight: z.number().min(0).max(1).describe("The semantic activation weight (0.0 to 1.0), where 1.0 is a key concept."),
});

const CognitiveHeatmapOutputSchema = z.object({
  heatmap: z.array(HeatmapWordSchema).describe("An array of words and their corresponding semantic weights. Only include words with a weight > 0.")
});
export type CognitiveHeatmapOutput = z.infer<typeof CognitiveHeatmapOutputSchema>;

export async function generateCognitiveHeatmap(input: CognitiveHeatmapInput): Promise<CognitiveHeatmapOutput> {
  return cognitiveHeatmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cognitiveHeatmapPrompt',
  input: {schema: CognitiveHeatmapInputSchema},
  output: {schema: CognitiveHeatmapOutputSchema},
  prompt: `You are a specialist in semantic analysis. Your task is to analyze the provided text and create a "cognitive heatmap".

Identify the key concepts, strategic terms, and important entities in the text. For each significant word, assign a "semantic activation weight" from 0.0 to 1.0. A weight of 1.0 represents a core concept, while a lower weight represents a supporting or less critical term. Common words (articles, prepositions) should have a weight of 0 and be excluded from the output.

Text to analyze:
"{{{text}}}"

Produce an array of words and their weights in the specified JSON format. Only include words with a weight greater than 0.
`,
});

const cognitiveHeatmapFlow = ai.defineFlow(
  {
    name: 'cognitiveHeatmapFlow',
    inputSchema: CognitiveHeatmapInputSchema,
    outputSchema: CognitiveHeatmapOutputSchema,
  },
  async (input) => {
    const response = await prompt(input, {model: input.model, retries: 3});
    return response.output!;
  }
);
