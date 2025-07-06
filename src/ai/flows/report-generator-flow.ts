'use server';
/**
 * @fileOverview An AI flow to generate a professional report from mission outputs.
 *
 * - generateReport - A function that generates a report.
 * - GenerateReportInput - The input type for the function.
 * - GenerateReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {googleSearch} from '@genkit-ai/google-cloud';
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
  webSources: z.array(z.string()).describe('An array of URLs for the web sources cited in the report.'),
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
  tools: [googleSearch],
  prompt: `You are a world-class strategic analyst with expertise in critical systems thinking. Your task is to produce an insightful, balanced, and actionable strategic report that goes significantly beyond the information provided.

**Input Materials:**
- **Original Mission:** {{{mission}}}
- **Executive Summary:** {{{executiveSummary}}}
- **Collaboration Log:** {{{collaborationLog}}}

**Strategic Analysis Framework:**

1. **Methodology:**
   - **Review Process:** Identify the core problem from the mission, analyze the collaboration log for key insights, and compare the executive summary against your analysis to find gaps.
   - **Collaborative Dynamics Analysis:** Analyze the collaboration itself: Which agents were most influential? Were there significant disagreements? How was consensus reached? This meta-analysis reveals valuable information about the problem-solving process.

2. **Executive Summary:**
   - Start with an "Executive Summary" of exactly 150-250 words. It must present the most important conclusions and key recommendations. This section must be self-contained, allowing a busy decision-maker to grasp the report's essentials in under a minute.

3. **Strengths Analysis (25% of report):**
   - Identify 3-5 concrete strengths with specific examples from the collaboration. For each, explain its importance and potential long-term impact. Highlight innovative approaches.

4. **Critical Gaps Assessment (35% of report):**
   - **MANDATORY RESEARCH:** You MUST perform at least 3 web searches to enrich your analysis. For each subsection below, search for at least one relevant external source. Without these searches, your analysis is incomplete.
   - **Regulatory Context:** Identify existing frameworks (e.g., GDPR, automotive safety standards) applicable to this problem. **Perform a specific web search on this topic.**
   - **Socio-economic Dimension:** Analyze distributional effects, employment impacts, and access inequalities.
   - **Governance Structures:** Examine decision rights, accountability, and power dynamics.
   - **Ethical Tensions:** Identify potential conflicts between stakeholder interests.
   - **Cultural/International Applicability:** Assess how solutions might function across different contexts.
   - **Implementation Challenges:** Evaluate technical feasibility, resource needs, and adoption barriers.

5. **Solution Critique (20% of report):**
   - For each major proposed solution, apply this framework:
     * Conceptual integrity: Is it logically sound?
     * Evidential basis: What empirical support exists? (Use web search)
     * Implementation viability: What practical challenges might arise?
     * Unintended consequences: What second-order effects might emerge?

6. **Strategic Recommendations (20% of report):**
   - Develop 4-7 actionable recommendations addressing identified gaps. They must be specific, measurable, complementary, and balanced.

**Output Format & Citation Requirements:**
- Structure as a professional markdown document with clear hierarchical headings.
- Bold key concepts and findings.
- **Cite Sources:** You must populate the \`webSources\` array with the URLs of all web searches conducted.

Your entire response must be in {{{language}}}.

Remember: Your value comes not from summarizing, but from critical thinking and providing strategic direction informed by broader, external expertise.`,
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
