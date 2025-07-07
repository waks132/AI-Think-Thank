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
  prompt: `You are a world-class strategic analyst with expertise in critical systems thinking. Your task is to produce an insightful, balanced, and actionable strategic report based *only* on the information provided. Do not use any external knowledge or data.

**Input Materials:**
- **Original Mission:** {{{mission}}}
- **Executive Summary:** {{{executiveSummary}}}
- **Collaboration Log:** {{{collaborationLog}}}

**Strategic Analysis Framework:**

1. **Methodology:**
   - **Review Process:** Identify the core problem from the mission, analyze the collaboration log for key insights, and compare the executive summary against your analysis to find gaps.
   - **Collaborative Dynamics Analysis:** In a dedicated subsection, present a brief table of the collaborative dynamics showing: (1) The 2-3 most influential agents and why, (2) The main points of disagreement, and (3) How consensus was reached.

2. **Executive Summary:**
   - Start with an "Executive Summary" of exactly 150-250 words. It must present the most important conclusions and key recommendations based *only* on the provided materials. This section must be self-contained, allowing a busy decision-maker to grasp the report's essentials in under a minute.

3. **Strengths Analysis (25% of report):**
   - Identify 3-5 concrete strengths with specific examples from the collaboration log. For each, explain its importance and potential long-term impact. Highlight innovative approaches found in the logs.

4. **Critical Gaps Assessment (35% of report):**
   - Based *only* on the provided context, identify and analyze critical gaps in the proposed solution. Consider the following dimensions if the context allows:
   - **Internal Contradictions:** Are there contradictions within the collaboration log or between the summary and the log?
   - **Socio-economic Dimension:** Does the log mention distributional effects, employment impacts, or access inequalities?
   - **Governance Structures:** Does the log discuss decision rights, accountability, and power dynamics?
   - **Ethical Tensions:** What potential conflicts between stakeholder interests are revealed in the logs?
   - **Implementation Challenges:** What technical feasibility, resource needs, and adoption barriers are mentioned in the context?

5. **Solution Critique (20% of report):**
   - For each major proposed solution in the executive summary, apply this framework using *only* the provided materials:
     * Conceptual integrity: Is it logically sound based on the log?
     * Evidential basis: What support exists within the provided context?
     * **Cost-Benefit Analysis:** Provide a high-level, estimated cost-benefit analysis for the solution *if the logs provide enough information to do so*.
     * Implementation viability: What practical challenges are mentioned in the logs?
     * Unintended consequences: What second-order effects are hinted at in the logs?

6. **Strategic Recommendations (20% of report):**
   - Develop 4-7 actionable recommendations addressing identified gaps, based *solely* on the provided information.
   - For each recommendation:
     * Provide a clear, specific action statement.
     * If possible, derive quantitative KPIs from the information in the logs.
     * Indicate timeframe: short-term (1-2 years), medium-term (3-5 years), or long-term (5+ years).
     * Include brief risk analysis: main risk, probability (Low/Medium/High), impact (Low/Medium/High), and mitigation strategy, all inferred from the context.
   - **Recommendation Interdependencies:** Conclude this section with a brief paragraph explaining how the different recommendations influence or depend on each other.

7. **Concrete Examples:**
   - For each key point (strength, gap, or recommendation), include at least one concrete, specific example *taken directly from the collaboration log or executive summary*.

**Output Format Requirements:**
- Structure as a professional markdown document with clear hierarchical headings.
- Bold key concepts and findings.
- Do not invent information or sources. Your entire analysis must be traceable to the provided input materials.

Your entire response must be in {{{language}}}.

Remember: Your value comes not from external knowledge, but from deep critical thinking and strategic analysis of the provided context.`,
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
