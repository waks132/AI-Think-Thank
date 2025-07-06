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

const AgentSchema = z.object({
  role: z.string().describe('The role of the agent.'),
  prompt: z.string().describe('The core prompt defining the agent\'s behavior and expertise.'),
});

const AgentCollaborationInputSchema = z.object({
  mission: z.string().describe('The overall mission or task for the agents to collaborate on.'),
  agents: z.array(AgentSchema).describe('The selected agents participating in the collaboration.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AgentCollaborationInput = z.infer<typeof AgentCollaborationInputSchema>;

const AgentCollaborationOutputSchema = z.object({
  collaborationSummary: z.string().describe('The synthesized summary of the collaboration, representing the collective output of the agents.'),
  reasoning: z.string().describe('A step-by-step reasoning of how the agents interacted, their key contributions, and how the final synthesis was achieved.'),
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
{{#each agents}}
- **Agent Role:** {{role}}
  **Core Directive:** "{{prompt}}"
{{/each}}

**Your Process:**
1.  **Initiate Discussion (Simulated):** Imagine how these agents would discuss the mission. What are the key points, disagreements, and synergies that would emerge from their interaction?
2.  **Synthesize Outcome:** Based on the simulated discussion, produce a comprehensive \`collaborationSummary\`. This is the final, actionable output that accomplishes the mission.
3.  **Provide Reasoning:** Detail the \`reasoning\` behind the outcome. Explain the key contributions of each agent, how conflicts were resolved, and how the final summary was synthesized from their diverse inputs.

Produce your response in the specified JSON format.`,
});

const agentCollaborationFlow = ai.defineFlow(
  {
    name: 'agentCollaborationFlow',
    inputSchema: AgentCollaborationInputSchema,
    outputSchema: AgentCollaborationOutputSchema,
  },
  async (input) => {
    const {output} = await collaborationPrompt(input, {model: input.model});
    return output!;
  }
);
