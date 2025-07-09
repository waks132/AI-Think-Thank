'use server';
/**
 * @fileOverview A flow to orchestrate a collaboration between multiple AI agents on a given mission.
 *
 * - runAgentCollaboration - Constructs and analyzes a discussion between selected agents to achieve a goal.
 * - AgentCollaborationInput - The input type for the runAgentCollaboration function.
 * - AgentCollaborationOutput - The return type for the runAgentCollaboration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { queryKnowledgeBaseTool } from '@/ai/tools/knowledge-base-tool';

const AgentCollaborationInputSchema = z.object({
  mission: z.string().describe('The overall mission or task for the agents to collaborate on.'),
  agentList: z.string().describe("A formatted string listing the participating agents and their directives. The simulation MUST only use agents from this list."),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AgentCollaborationInput = z.infer<typeof AgentCollaborationInputSchema>;

const AgentContributionSchema = z.object({
    agentId: z.string().describe("The unique ID of the agent (e.g., 'helios', 'veritas'). This MUST match one of the IDs provided in the agent list."),
    agentRole: z.string().describe("The role of the agent."),
    keyContribution: z.string().describe("A concise summary of the agent's single most critical and unique contribution to the final solution."),
    contributionType: z.enum(['Proposition', 'Critique', 'Synthèse', 'Analyse', 'Questionnement', 'Enrichissement']).describe("The nature of the agent's main contribution.")
});
export type AgentContribution = z.infer<typeof AgentContributionSchema>;

const ConformityCheckSchema = z.object({
  isCompliant: z.boolean().describe("Whether the executive summary is compliant with the framework's requirements based on the knowledge base."),
  reportsConsulted: z.array(z.string()).describe("An array of document IDs from the knowledge base that were consulted for this check."),
  summary: z.string().describe("A brief summary explaining how the executive summary avoids past mistakes and respects the control framework's rules found in the consulted documents."),
});

const AgentCollaborationOutputSchema = z.object({
  executiveSummary: z.string().describe('A structured executive summary of the final proposed framework or solution, formatted with clear headings and bullet points.'),
  reasoning: z.string().describe('A step-by-step reasoning explaining how the final synthesis was achieved by integrating the different agent contributions.'),
  agentContributions: z.array(AgentContributionSchema).describe("A list detailing the key contribution of EACH participating agent. Every agent from the input list must be represented here."),
  conformityCheck: ConformityCheckSchema.describe("The result of the mandatory conformity check against the internal knowledge base."),
});
export type AgentCollaborationOutput = z.infer<typeof AgentCollaborationOutputSchema>;

export async function runAgentCollaboration(input: AgentCollaborationInput): Promise<AgentCollaborationOutput> {
  return agentCollaborationFlow(input);
}

const agentCollaborationPrompt = ai.definePrompt({
  name: 'agentCollaborationPrompt',
  tools: [queryKnowledgeBaseTool],
  input: {schema: AgentCollaborationInputSchema},
  output: {schema: AgentCollaborationOutputSchema},
  prompt: `You are a master orchestrator of a cognitive collective of AI agents. Your primary task is to determine the optimal solution for a given mission by simulating a collaboration between a selected team of agents.

**Mission:**
"{{{mission}}}"

**Participating Agents:**
The collaboration you simulate MUST feature contributions from **every single agent** listed below. No agent should be omitted. The simulation must ONLY use agents from this roster.
{{{agentList}}}

**Your Comprehensive Process:**

1.  **Simulate Collaboration & Detail Agent Contributions:** For **every single agent** from the 'Participating Agents' list, you MUST summarize their single most critical and unique contribution to the final solution. Populate the \`agentContributions\` array with this analysis. Each agent must have one entry.

2.  **MANDATORY CONFORMITY CHECK:** Before writing the final summary, you MUST ensure compliance with our internal frameworks.
    *   **Use the \`queryKnowledgeBaseTool\`** to search for relevant conformity reports and frameworks. Search for documents with IDs like "ANALYSIS-CONFORMITY-..." or "FRAMEWORK-IA-CONTROL-...".
    *   **Analyze the findings** to understand past failures (e.g., lack of realism, missing "Red Team", vague financing, ignoring political facts) and mandatory procedures.
    *   **Populate the \`conformityCheck\` field:** List the document IDs you consulted and write a summary explaining how your proposed solution explicitly avoids the documented errors and adheres to the control framework.

3.  **Synthesize Final Outcome:** Based on the contributions AND the conformity check, produce a comprehensive \`executiveSummary\`. This summary MUST be realistic, actionable, and compliant with the lessons learned from the knowledge base.

4.  **Provide Detailed Reasoning:** Based on the contributions, explain the \`reasoning\` behind how you synthesized the final \`executiveSummary\` from the various key contributions of the agents.

Produce your entire response in the specified JSON format, filling all fields of the output schema. Your entire response, including all text fields, must be in this language: {{{language}}}.`,
});


const agentCollaborationFlow = ai.defineFlow(
  {
    name: 'agentCollaborationFlow',
    inputSchema: AgentCollaborationInputSchema,
    outputSchema: AgentCollaborationOutputSchema,
  },
  async (input) => {
    const response = await agentCollaborationPrompt(input, {
      model: input.model,
      config: { maxOutputTokens: 8192 },
      retries: 10,
    });
    
    const output = response.output;
    if (!output) {
        throw new Error("Failed to generate agent collaboration result.");
    }
    
    return output;
  }
);
