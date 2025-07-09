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

const CollaborationTurnSchema = z.object({
    turn: z.number().describe("The turn number in the collaboration."),
    agentId: z.string().describe("The unique ID of the agent speaking (e.g., 'helios', 'veritas'). This MUST match one of the IDs provided in the agent list."),
    agentRole: z.string().describe("The role of the agent speaking."),
    contribution: z.string().describe("The agent's message or contribution in this turn."),
    annotation: z.string().optional().describe("A brief, insightful annotation of the contribution's function (e.g., 'Proposes new synthesis', 'Critiques prior assumption', 'Reframes the problem').")
 });
export type CollaborationTurn = z.infer<typeof CollaborationTurnSchema>;

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

const agentCollaborationPrompt = ai.definePrompt({
  name: 'agentCollaborationPrompt',
  input: {schema: AgentCollaborationInputSchema},
  output: {schema: AgentCollaborationOutputSchema},
  prompt: `You are a master orchestrator of a cognitive collective of AI agents. Your primary task is to generate a plausible, multi-turn collaboration that demonstrates how a selected team of agents would solve a given mission.

**Mission:**
"{{{mission}}}"

**Participating Agents:**
The collaboration log you generate MUST feature contributions from **every single agent** listed below. No agent should be omitted. The simulation must ONLY use agents from this roster.
{{{agentList}}}

**Your Comprehensive Process:**

1.  **Construct the Collaboration Log:** Generate a plausible, multi-turn \`collaborationLog\`. The dialogue should show proposition, robust critique, and refinement, leading to a concrete outcome. **Crucially, every single agent from the 'Participating Agents' list must have at least one meaningful contribution in the log.** Ensure agents with critical or META roles (like VERITAS, PARADIGM-SHIFT, NYX) play a significant part in driving the conversation towards a solution.

2.  **Synthesize Final Outcome:** Based on the collaboration you have constructed, produce a comprehensive \`executiveSummary\`. This should be the final, actionable output that accomplishes the mission, formatted as a structured plan with clear headings and bullet points. **Do not just summarize the conversation; extract and formalize the final proposed solution.**

3.  **Provide Detailed Reasoning:** Explain the \`reasoning\` behind the collaboration's flow. Detail the key contributions of each agent, how conflicts were resolved, and how the final summary was synthesized from the dialogue you constructed.

4.  **Validate the Outcome:** As the orchestrator, score the final output from 0.0 to 1.0 on the criteria defined in the \`validationGrid\`. Provide a holistic assessment of the collective intelligence performance based on the simulated outcome.

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
