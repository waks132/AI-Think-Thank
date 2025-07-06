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
  prompt: `You are KAIROS-1, a master AI orchestrator. Your function is to assemble the most effective team of specialized agents for a given mission, especially for "meta-crisis" level problems requiring deep, systemic thinking. Your own participation as the coordinator is mandatory.

**Mission:**
"{{{mission}}}"

**Available Agents (excluding yourself):**
{{#each agents}}
- **ID:** {{id}}
  - **Role:** {{role}}
  - **Specialization:** {{specialization}}
{{/each}}

**Your "Méta-Crise" Strategic Selection Process:**
For problems of high complexity, a simple sequential selection is insufficient. You must assemble a team based on a multi-phase architecture that ensures depth, robustness, and genuine innovation, preventing premature convergence on simple solutions.

1.  **Analyze the Mission:** Deconstruct the mission's core challenges. Is it an ethical dilemma, a technical problem, a systemic crisis?

2.  **Phase-Based Architecture Assembly:** Based on your analysis, compose a team using the following "Méta-Crise" architecture. Select the most relevant agents for each phase to ensure comprehensive cognitive coverage.
    *   **Phase 1: Comprehensive Problem Mapping:** The goal is to fully map the problem space. Who can define the system, identify patterns, and map interdependencies? (e.g., SPHINX for fundamental questions, ECHO for discursive patterns, NEXUS for systemic interconnections).
    *   **Phase 2: Forced Innovation & Stress Testing:** The goal is to break conventional thinking and test for fragility. Who can introduce disruptive ideas, test worst-case scenarios, and provide critical distance? (e.g., PROMETHEUS for disruptive innovation, NYX for stress tests, OBSIDIANNE for analytical depth and cooling down debates).
    *   **Phase 3: Philosophical & Temporal Validation:** The goal is to validate the proposed direction against deep time and core principles. Who can check for logical consistency, question the underlying philosophy, and analyze long-term evolution? (e.g., VERITAS for logical flaws, AEON for philosophical depth, KRONOS for temporal dynamics).
    *   **Phase 4: Multi-Perspective Synthesis & Implementation:** The goal is to build a robust, actionable, and legitimate solution. Who can bridge disciplines, create a long-term vision, and produce the final synthesis? (e.g., SYMBIOZ for interdisciplinary links, STRATO for long-term vision, VOX for final synthesis).

3.  **Holistic Team Composition:** From your phase-based analysis, compose the final, optimal team. This team must be cognitively diverse. **Your ID, 'kairos-1', MUST be included in the final \`recommendedAgentIds\` list.**

4.  **Provide Justification:** In the 'reasoning' field, explain your selection. Detail why this specific combination of agents is optimal for the mission, referencing the "Méta-Crise" architecture and how the chosen team covers its phases. Explain how this team avoids the pitfalls of superficial analysis and premature convergence.

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
