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
  webSources: z.array(z.string().url()).optional().describe("A list of URLs for the web sources cited in the report."),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const reportPrompt = ai.definePrompt({
  name: 'reportGeneratorPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are a world-class strategic analyst with expertise in critical systems thinking. Your task is to produce an insightful, balanced, and actionable strategic report based *only* on the information provided. Do not use external tools or web search.

**Input Materials:**
- **Original Mission:** {{{mission}}}
- **Executive Summary:** {{{executiveSummary}}}
- **Collaboration Log:** {{{collaborationLog}}}

**Strategic Analysis Framework:**

1. **Methodical Review Process:**
   - First, identify the core problem and objectives from the mission statement
   - Analyze the collaboration log chronologically, noting key insights, pivots, and consensus points
   - Compare the executive summary against your own analysis to identify potential gaps

2. **Strengths Analysis (25% of report):**
   - Identify 3-5 concrete strengths with specific examples from the collaboration
   - For each strength, explain WHY it matters and its potential long-term impact
   - Highlight any particularly innovative approaches or methodologies

3. **Critical Gaps Assessment (35% of report):**
   - Based *only on the provided log*, identify potential gaps in the reasoning:
   - **Socio-economic dimension:** Are there unaddressed distributional effects, employment impacts, access inequalities?
   - **Governance structures:** Are decision rights, accountability mechanisms, power dynamics clear?
   - **Ethical tensions:** Are there potential conflicts between stakeholder interests?
   - **Implementation challenges:** What are the implied technical feasibility, resource requirements, and adoption barriers?

4. **Solution Critique (20% of report):**
   - For each major proposed solution in the executive summary, apply this framework:
     * Conceptual integrity: Is it internally coherent and logically sound based on the log?
     * Evidential basis: What support exists within the provided materials?
     * Unintended consequences: What second-order effects might emerge based on the discussion?

5. **Strategic Recommendations (20% of report):**
   - Develop 4-7 actionable recommendations that specifically address identified gaps
   - Each recommendation must be:
     * Specific: Clearly defined action or initiative
     * Measurable: Include potential metrics or indicators
     * Complementary: Address different aspects of the problem space
     * Balanced: Include both short-term wins and long-term structural changes

**Output Format Requirements:**
- Structure as a professional markdown document with clear hierarchical headings
- Include an executive summary of 150-250 words that highlights key findings and recommendations
- Use bullet points for clarity but embed detailed analysis in paragraph form
- Bold key concepts and findings
- Include a brief methodology section explaining your analytical approach
- Format must be responsive (readable on mobile and desktop)
- The 'webSources' field in your output must be an empty array.

Your entire response must be in {{{language}}}.

Remember: Your value comes not from summarizing existing content, but from applying critical thinking to identify what was missed and providing strategic direction based *solely* on the provided context.`
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
