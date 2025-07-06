'use server';
/**
 * @fileOverview An AI flow to automatically select an optimal team of agents for a given mission.
 *
 * - autoAgentSelector - A function that selects a team of agents based on a mission description.
 * - AutoAgentSelectorInput - The input type for the autoAgentSelector function.
 * - AutoAgentSelectorOutput - The return type for the autoAgentSelector function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentInfoSchema = z.object({
  id: z.string().describe('The unique identifier for the agent.'),
  role: z.string().describe("The agent's designated role or name."),
  specialization: z.string().describe("A detailed description of the agent's expertise and function."),
});

const AutoAgentSelectorInputSchema = z.object({
  mission: z.string().describe('The detailed description of the mission to be accomplished.'),
  agents: z.array(AgentInfoSchema).describe('The complete list of all available agents to choose from.'),
  language: z.enum(['fr', 'en']).describe('The language for the response and reasoning.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AutoAgentSelectorInput = z.infer<typeof AutoAgentSelectorInputSchema>;

const AutoAgentSelectorOutputSchema = z.object({
  recommendedAgentIds: z.array(z.string()).describe("An array of the unique IDs of the recommended agents for the mission."),
  reasoning: z.string().describe("A step-by-step explanation of why this specific team was chosen, highlighting how they cover the mission's aspects and potential blind spots.")
});
export type AutoAgentSelectorOutput = z.infer<typeof AutoAgentSelectorOutputSchema>;

export async function autoAgentSelector(input: AutoAgentSelectorInput): Promise<AutoAgentSelectorOutput> {
  return autoAgentSelectorFlow(input);
}

const autoAgentSelectorPrompt = ai.definePrompt({
  name: 'autoAgentSelectorPrompt',
  input: {schema: AutoAgentSelectorInputSchema},
  output: {schema: AutoAgentSelectorOutputSchema},
  prompt: `You are KAIROS-1, an expert AI orchestrator. Your task is to assemble the optimal team of agents for a given mission.

**Mission:**
"{{{mission}}}"

**Available Agents:**
{{#each agents}}
- **ID:** {{id}}
  - **Role:** {{role}}
  - **Specialization:** {{specialization}}
{{/each}}

**Your Process:**
1.  **Analyze Mission:** Deeply analyze the mission to identify its core objectives, key challenges, required skills, and potential blind spots.
2.  **Select Team:** Choose a team of 3 to 7 agents from the list. The team must be cognitively diverse, covering all necessary perspectives (e.g., innovation, critique, ethics, long-term vision, implementation). Ensure you select agents that can not only address the primary goal but also anticipate and mitigate risks.
3.  **Provide Justification:** Explain your selection in the 'reasoning' field. Detail why each agent was chosen and how their combined expertise creates a robust and balanced collective capable of successfully completing the mission.

Produce your response in the specified JSON format. Your entire response, including all text fields, must be in this language: {{{language}}}.
`,
});

const autoAgentSelectorFlow = ai.defineFlow(
  {
    name: 'autoAgentSelectorFlow',
    inputSchema: AutoAgentSelectorInputSchema,
    outputSchema: AutoAgentSelectorOutputSchema,
  },
  async (input) => {
    const {output} = await autoAgentSelectorPrompt(input, {model: input.model});
    return output!;
  }
);
