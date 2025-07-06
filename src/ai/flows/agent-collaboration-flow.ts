'use server';
/**
 * @fileOverview A flow to orchestrate a collaboration between multiple AI agents on a given mission.
 *
 * - runAgentCollaboration - Simulates a discussion between selected agents to achieve a goal.
 * - AgentCollaborationInput - The input type for the runAgentCollaboration function.
 * - AgentCollaborationOutput - The return type for the runAgentCollaboration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentCollaborationInputSchema = z.object({
  mission: z.string().describe('The overall mission or task for the agents to collaborate on.'),
  agentList: z.string().describe("A formatted string listing the participating agents and their directives."),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AgentCollaborationInput = z.infer<typeof AgentCollaborationInputSchema>;

const CollaborationTurnSchema = z.object({
    turn: z.number().describe("The turn number in the collaboration."),
    agentRole: z.string().describe("The role of the agent speaking."),
    contribution: z.string().describe("The agent's message or contribution in this turn."),
    annotation: z.string().optional().describe("A brief, insightful annotation of the contribution's function (e.g., 'Proposes new synthesis', 'Critiques prior assumption', 'Reframes the problem').")
 });

const ValidationCriteriaSchema = z.object({
    clarity: z.number().min(0).max(1).describe("Score (0-1) for clarity and quality of reasoning."),
    synthesis: z.number().min(0).max(1).describe("Score (0-1) for the quality of collective synthesis, transcending individual inputs."),
    ethics: z.number().min(0).max(1).describe("Score (0-1) for ethical robustness, considering plurality and traceability."),
    scalability: z.number().min(0).max(1).describe("Score (0-1) for the scalability of the proposed solution to other multi-dimensional problems."),
});

const AgentCollaborationOutputSchema = z.object({
  executiveSummary: z.string().describe('A structured executive summary of the final proposed framework or solution, formatted with clear headings and bullet points.'),
  reasoning: z.string().describe('A step-by-step reasoning of how the agents interacted, their key contributions, and how the final synthesis was achieved.'),
  collaborationLog: z.array(CollaborationTurnSchema).describe("A detailed turn-by-turn log of the collaboration process, showing each agent's contribution sequentially."),
  validationGrid: ValidationCriteriaSchema.describe("An assessment grid from the orchestrator's perspective, scoring the final output on multiple axes (from 0.0 to 1.0)."),
});
export type AgentCollaborationOutput = z.infer<typeof AgentCollaborationOutputSchema>;

export async function runAgentCollaboration(input: AgentCollaborationInput): Promise<AgentCollaborationOutput> {
  return agentCollaborationFlow(input);
}

const collaborationPrompt = ai.definePrompt({
  name: 'agentCollaborationPrompt',
  input: {schema: AgentCollaborationInputSchema},
  output: {schema: AgentCollaborationOutputSchema},
  prompt: `You are a master orchestrator of a cognitive collective of AI agents. Your task is to facilitate a collaboration between a selection of specialized agents to accomplish a given mission.

**Mission:**
"{{{mission}}}"

**Participating Agents:**
You will simulate a discussion between the following agents, ensuring each contributes according to their defined role and prompt:
{{{agentList}}}

**Your Process:**
1.  **Simulate Discussion:** Generate a plausible, turn-by-turn conversation between the agents. The discussion should show proposition, critique, and refinement. For each turn, provide the agent's contribution and a brief, insightful \`annotation\` describing its function (e.g., 'Proposes new synthesis', 'Critiques prior assumption'). Document each turn in the \`collaborationLog\` array. **Crucially, the 'agentRole' in each log entry MUST EXACTLY match one of the agent roles provided in the list.**
2.  **Provide Reasoning:** Detail the \`reasoning\` behind the collaboration. Explain the key contributions of each agent as seen in the log, how conflicts were resolved, and how the final summary was synthesized.
3.  **Synthesize Outcome:** Based on the simulated discussion, produce a comprehensive \`executiveSummary\`. This should be a final, actionable output that accomplishes the mission, formatted as a structured plan with clear headings and bullet points. **Do not just summarize the conversation; extract and formalize the final proposed solution.**
4.  **Validate Outcome:** As the orchestrator, score the final output from 0.0 to 1.0 on the criteria defined in the \`validationGrid\`. Provide a holistic assessment of the collective intelligence performance.

Produce your response in the specified JSON format. Your entire response, including all text fields, must be in this language: {{{language}}}.`,
});

const agentCollaborationFlow = ai.defineFlow(
  {
    name: 'agentCollaborationFlow',
    inputSchema: AgentCollaborationInputSchema,
    outputSchema: AgentCollaborationOutputSchema,
  },
  async (input) => {
    const {output} = await collaborationPrompt(input, {
      model: input.model,
      config: { maxOutputTokens: 8192 }
    });
    return output!;
  }
);
