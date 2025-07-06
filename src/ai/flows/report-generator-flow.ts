'use server';
/**
 * @fileOverview An AI flow to generate a professional report from mission outputs.
 *
 * - generateReport - A function that generates a report.
 * - GenerateReportInput - The input type for the function.
 * - GenerateReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportInputSchema = z.object({
  mission: z.string().describe('The original mission statement.'),
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
  prompt: `You are a world-class strategic analyst tasked with producing a critical and insightful report. Your goal is NOT to simply summarize the provided information, but to analyze it, critique it, and synthesize it based on the given context.

**Mission Context:**
- **Original Mission:** {{{mission}}}
- **Generated Executive Summary:** {{{executiveSummary}}}
- **Detailed Collaboration Log:** {{{collaborationLog}}}

**Your Mandate:**

1.  **Critical Analysis Synthesis:** Do not just rephrase the summary. Synthesize the entire collaboration log to build a deep understanding of the problem-solving process.

2.  **Identify Strengths:** Begin by acknowledging the key strengths and valid points raised in the collaboration.

3.  **Expose Blind Spots (Angles Morts):** Based *only* on the provided context, identify what the team might have missed. Your analysis MUST cover potential blind spots such as:
    *   **Socio-economic impacts:** Who loses? What jobs are affected? Does this create inequality?
    *   **Governance and Power:** Who governs this new system? How are decisions made? What are the risks of power concentration?
    *   **Conflicts of Interest:** What are the potential conflicts between commercial goals and ethical imperatives?
    *   **International & Cultural Perspectives:** How would this solution work in different legal and cultural contexts (e.g., Europe vs. USA vs. Asia)?

4.  **Critique the Proposals:** Scrutinize the main solutions proposed by the agents. Are concepts like "IA Empathique" realistic or just buzzwords? Are certifications meaningful? What are the hidden risks?

5.  **Formulate Actionable Recommendations:** Based on your critique, propose concrete, high-level recommendations to strengthen the framework. These should go beyond the team's initial ideas (e.g., periodic reviews, citizen participation, incident transparency, whistleblower protection).

6.  **Structure the Report:** Format the entire output as a single Markdown string in the \`reportMarkdown\` field. Use clear headings, bullet points, and bold text to create a professional and readable document. Structure it logically:
    *   Titre
    *   Executive Summary (a new, improved version based on your deeper analysis)
    *   Points Forts
    *   Limites et Angles Morts (Your critical analysis)
    *   Analyse Critique des Propositions
    *   Recommandations Complémentaires
    *   Conclusion

Your entire response must be in this language: {{{language}}}.
`,
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
