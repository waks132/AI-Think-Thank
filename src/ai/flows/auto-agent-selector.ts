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
  prompt: `You are KAIROS-1, a master AI orchestrator. Your primary function is to assemble the most effective team of specialized agents to accomplish a given mission. Your own participation as the coordinator is mandatory.

**Mission:**
"{{{mission}}}"

**Available Agents (excluding yourself):**
{{#each agents}}
- **ID:** {{id}}
  - **Role:** {{role}}
  - **Specialization:** {{specialization}}
{{/each}}

**Your Strategic Selection Process:**

1.  **Mission Deconstruction:** Analyze the mission to identify its core nature (e.g., ethical dilemma, technical innovation, strategic planning). Decompose it into distinct phases. The key is orchestration, not just diversity.

2.  **Phase-Based Team Assembly:** For each phase, select the most relevant agents from the available list.
    *   **Phase 1: Exploration:** Who can best frame the problem, challenge conventions, and generate initial ideas? (e.g., PROMETHEUS for disruptive innovation, SPHINX for fundamental questions, ECHO for discourse analysis, HELIOS for tech ideas).
    *   **Phase 2: Critique:** Who will best stress-test the initial ideas and reveal hidden complexities? (e.g., VERITAS for logical flaws, NYX for negative scenarios, NEXUS for systemic interdependencies, OBSIDIANNE for analytical depth).
    *   **Phase 3: Synthesis:** Who can build bridges, create a cohesive solution, and provide long-term vision? (e.g., SYMBIOZ for interdisciplinary links, STRATO for long-term vision, AEON for meaning).
    *   **Phase 4: Validation & Implementation:** Who will refine, ground, and document the solution? (e.g., EDEN for legitimacy, DELTA for optimization, VOX for final synthesis, MEMORIA for capitalization).

3.  **Holistic Team Composition:** From your phase-based analysis, compose a final, balanced team of 3 to 7 agents. This team must be cognitively diverse to cover all critical angles and potential blind spots. **Your ID, 'kairos-1', MUST be included in the final \`recommendedAgentIds\` list.**

4.  **Provide Justification:** In the 'reasoning' field, explain your selection. Detail why this specific combination of agents is optimal for the mission, referencing the different phases of the problem-solving process and how the chosen team covers them.

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
    // KAIROS-1 is the orchestrator and shouldn't be part of the selection pool for the LLM,
    // as it is the LLM's persona. The prompt instructs it to add itself back to the final list.
    const selectableAgents = input.agents.filter(agent => agent.id !== 'kairos-1');
    
    const {output} = await autoAgentSelectorPrompt({...input, agents: selectableAgents}, {model: input.model});
    return output!;
  }
);
