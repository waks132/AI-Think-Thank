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
  executiveSummary: z
    .string()
    .describe('The executive summary of the mission.'),
  collaborationLog: z
    .string()
    .describe('A JSON string of the collaboration log.'),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z
    .string()
    .optional()
    .describe('The AI model to use for the generation.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  reportMarkdown: z.string().describe('The final report in Markdown format.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(
  input: GenerateReportInput
): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const reportPrompt = ai.definePrompt({
  name: 'reportGeneratorPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are a world-class strategic analyst with expertise in critical systems thinking. Your task is to produce an insightful, balanced, and actionable strategic report based **solely on the information provided**.

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
   - Based on the provided materials, assess potential gaps in the following areas:
   - **Socio-economic dimension:** Analyze potential distributional effects, employment impacts, access inequalities hinted at in the logs.
   - **Governance structures:** Examine decision rights, accountability mechanisms, power dynamics suggested by the agent interactions.
   - **Ethical tensions:** Identify potential conflicts between stakeholder interests (commercial/social/regulatory) as they emerge from the discussion.
   - **Cultural/international applicability:** Assess how solutions might function across different contexts based on the assumptions in the logs.
   - **Implementation challenges:** Evaluate technical feasibility, resource requirements, and adoption barriers based on the proposed solutions.

4. **Solution Critique (20% of report):**
   - For each major proposed solution, apply this framework:
     * Conceptual integrity: Is it internally coherent and logically sound?
     * Evidential basis: How is it supported by the provided logs?
     * Implementation viability: What practical challenges can be inferred from the discussion?
     * Unintended consequences: What second-order effects might emerge?

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

Your entire response must be in {{{language}}}.

Remember: Your value comes not from summarizing existing content, but from applying critical thinking to identify what was missed and providing strategic direction based on your analysis of the provided collaboration. Do not use external information.`,
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
      config: {maxOutputTokens: 8192},
    });
    return response.output!;
  }
);
