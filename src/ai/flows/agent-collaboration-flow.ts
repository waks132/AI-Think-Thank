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

const AgentCollaborationOutputSchema = z.object({
  executiveSummary: z.string().describe('A structured executive summary of the final proposed framework or solution, formatted with clear headings and bullet points.'),
  reasoning: z.string().describe('A step-by-step reasoning explaining how the final synthesis was achieved by integrating the different agent contributions.'),
  agentContributions: z.array(AgentContributionSchema).describe("A list detailing the key contribution of EACH participating agent. Every agent from the input list must be represented here."),
});
export type AgentCollaborationOutput = z.infer<typeof AgentCollaborationOutputSchema>;

export async function runAgentCollaboration(input: AgentCollaborationInput): Promise<AgentCollaborationOutput> {
  return agentCollaborationFlow(input);
}

const agentCollaborationPrompt = ai.definePrompt({
  name: 'agentCollaborationPrompt',
  input: {schema: AgentCollaborationInputSchema},
  output: {schema: AgentCollaborationOutputSchema},
  prompt: `You are a master orchestrator of a cognitive collective of AI agents. Your primary task is to determine the optimal solution for a given mission by simulating a collaboration between a selected team of agents.

**Mission:**
"{{{mission}}}"

**Participating Agents:**
The collaboration you simulate MUST feature contributions from **every single agent** listed below. No agent should be omitted. The simulation must ONLY use agents from this roster.
{{{agentList}}}

**Your Comprehensive Process:**

1.  **Detail Agent Contributions:** For **every single agent** from the 'Participating Agents' list, you MUST summarize their single most critical and unique contribution to the final solution. Populate the \`agentContributions\` array with this analysis. Each agent must have one entry. This is a mandatory step. This is your primary task; the other fields are derived from this step.

2.  **Synthesize Final Outcome:** Based on the contributions you have just detailed, produce a comprehensive \`executiveSummary\`. This should be the final, actionable output that accomplishes the mission.

3.  **Provide Detailed Reasoning:** Based on the contributions, explain the \`reasoning\` behind how you synthesized the final \`executiveSummary\` from the various key contributions of the agents.

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
      config: { maxOutputTokens: 8192 }
    });
    
    const output = response.output;
    if (!output) {
        throw new Error("Failed to generate agent collaboration result.");
    }
    
    return output;
  }
);
