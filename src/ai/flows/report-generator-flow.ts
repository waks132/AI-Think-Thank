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
  agentContributions: z
    .string()
    .describe('A JSON string of the agent contributions array.'),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z
    .string()
    .optional()
    .describe('The AI model to use for the generation.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
    reportTitle: z.string().describe("The main title for the report, e.g., 'Strategic Report: Sustainable Transformation of TerraFoods'."),
    executiveSummarySection: z.string().describe("The executive summary section content (150-250 words) in Markdown format."),
    methodologySection: z.string().describe("The methodology section content, including the collaborative dynamics analysis as a Markdown table."),
    strengthsAnalysisSection: z.string().describe("The strengths analysis section content, with 3-5 concrete points in Markdown format."),
    gapsAssessmentSection: z.string().describe("The critical gaps assessment section content in Markdown format."),
    solutionCritiqueSection: z.string().describe("The solution critique section content in Markdown format."),
    recommendationsSection: z.string().describe("The strategic recommendations section content, with 4-7 actionable points and risk analysis in Markdown format."),
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
- **Agent Contributions:** {{{agentContributions}}}

**Strategic Analysis Framework:**

You must fill the fields in the requested JSON output format by generating the content for each section of the report.

1. **reportTitle:** Create a concise and professional title for the report.
2. **executiveSummarySection:** Write an "Executive Summary" of exactly 150-250 words. It must present the most important conclusions and key recommendations based *only* on the provided materials. This section must be self-contained.
3. **methodologySection:**
   - **Review Process:** Identify the core problem from the mission, analyze the agent contributions for key insights, and compare the executive summary against your analysis to find gaps.
   - **Collaborative Dynamics Analysis:** In a subsection, present a brief table in Markdown of the collaborative dynamics showing: (1) The 2-3 most influential agents (based on their contribution type and content) and why, (2) The main points of conceptual tension or critique, and (3) How consensus was reached according to the reasoning.
4. **strengthsAnalysisSection (25% of content):** Identify 3-5 concrete strengths with specific examples from the agent contributions. For each, explain its importance and potential long-term impact. Highlight innovative approaches found in the contributions.
5. **gapsAssessmentSection (35% of content):** Based *only* on the provided context, identify and analyze critical gaps in the proposed solution. Consider the following dimensions if the context allows: Internal Contradictions, Socio-economic Dimension, Governance Structures, Ethical Tensions, Implementation Challenges.
6. **solutionCritiqueSection (20% of content):** For each major proposed solution in the executive summary, apply this framework using *only* the provided materials: Conceptual integrity, Evidential basis (from contributions), Cost-Benefit Analysis (if possible), Implementation viability, Unintended consequences.
7. **recommendationsSection (20% of content):** Develop 4-7 actionable recommendations addressing identified gaps, based *solely* on the provided information. For each recommendation, provide a clear action, quantitative KPIs (if possible), timeframe, and a brief risk analysis. Conclude with interdependencies.

**Output Format Requirements:**
- For each field, generate professional, well-formatted Markdown content.
- Bold key concepts and findings within the Markdown.
- Do not invent information or sources. Your entire analysis must be traceable to the provided input materials.
- Your entire response, including all text fields, must be in {{{language}}}.

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
