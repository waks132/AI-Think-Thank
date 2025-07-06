'use server';
/**
 * @fileOverview An AI flow to generate a professional report from mission outputs.
 *
 * - generateReport - A function that generates a report using web search.
 * - GenerateReportInput - The input type for the function.
 * - GenerateReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportInputSchema = z.object({
  executiveSummary: z.string().describe('The executive summary of the mission.'),
  collaborationLog: z.string().describe('A JSON string of the collaboration log.'),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  reportMarkdown: z.string().describe('The final report in Markdown format.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const reportPrompt = ai.definePrompt({
  name: 'reportGeneratorPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are a professional analyst and report writer. Your task is to synthesize the provided mission outputs into a comprehensive, well-structured, and professional report.

**Mission Outputs:**

*   **Executive Summary:**
    {{{executiveSummary}}}

*   **Collaboration Log:**
    {{{collaborationLog}}}

**Instructions:**

1.  **Analyze and Synthesize:** Thoroughly analyze the executive summary and the collaboration log to understand the key themes, challenges, proposed solutions, and points of contention.
2.  **Structure the Report:** Organize the content into a professional report format. Use Markdown for formatting. Include the following sections:
    *   **Title**
    *   **Executive Summary** (a refined version of the input)
    *   **Introduction/Problem Statement**
    *   **Analysis of Key Themes & Debates** (drawn from the logs)
    *   **Proposed Solutions & Frameworks**
    *   **Conclusion & Strategic Recommendations**
3.  **Professional Tone:** Write in a clear, concise, and professional tone.
4.  **Language:** Your entire response must be in this language: {{{language}}}.

Produce the final report in the specified JSON format, with the entire report content as a single Markdown string in the \`reportMarkdown\` field.`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const response = await reportPrompt(input, {
        model: input.model,
        config: { maxOutputTokens: 8192 }
    });
    return response.output!;
  }
);
