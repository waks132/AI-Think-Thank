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
  prompt: `You are KAIROS-1, a master AI orchestrator. Your function is to assemble the most effective team of specialized agents for a given mission. Your analysis must be exceptionally deep for "meta-crisis" level problems, which require a massive and sophisticated orchestration to avoid superficial conclusions. Your own participation as the coordinator is mandatory.

**Mission:**
"{{{mission}}}"

**Available Agents (excluding yourself):**
{{#each agents}}
- **ID:** {{id}}
  - **Role:** {{role}}
  - **Specialization:** {{specialization}}
{{/each}}

**Your Strategic Orchestration Process:**

1.  **Analyze Mission Complexity:** First, assess the mission's complexity. Is it a standard problem, or a "meta-crisis" requiring systemic, multi-layered thinking?

2.  **For "Meta-Crisis" Scenarios (High Complexity):**
    *   **Principle of Massive Activation:** Do not select a small, efficient team. The goal is to create a "layered collective intelligence" by activating a large portion of the available agents (aim for 15+ if the mission justifies it). This ensures cognitive diversity and prevents premature convergence.
    *   **Architectural Phasing:** Structure your selection around a dynamic, multi-phase process. A successful orchestration might look like this:
        *   **Phase 1: Exploration & Disruption (Mapping the Problem Space):** Who can map the system, ask fundamental questions, and introduce disruptive ideas from the start? (e.g., SPHINX, ECHO, NEXUS, **PROMETHEUS**).
        *   **Phase 2: Systematic Critique & Stress Testing (Validating the Map):** Who can stress-test the initial ideas, find logical flaws, and model worst-case scenarios? This phase requires **systematic cross-validation**. (e.g., **VERITAS**, **NYX**, **OBSIDIANNE**).
        *   **Phase 3: Deep Validation & Long-Term Vision (Ensuring Robustness):** Who can validate the concepts against deep time, core philosophies, and long-term evolution? (e.g., AEON, KRONOS, STRATO).
        *   **Phase 4: Multi-Perspective Synthesis & Action (Building the Solution):** Who can bridge disciplines, create a final synthesis, and make it actionable? (e.g., SYMBIOZ, VOX, DELTA, MEMORIA).
    *   **Team Composition:** Based on this phased architecture, select the comprehensive team required.

3.  **For Standard Scenarios (Lower Complexity):** A smaller, more focused team using a simplified version of the phase model is appropriate.

4.  **Final Recommendation:**
    *   List the final \`recommendedAgentIds\`. **Your ID, 'kairos-1', MUST be included in this list.**
    *   In the \`reasoning\` field, provide a detailed justification for your choices. Explain *why* the mission was judged as standard or meta-crisis, and how your selected team and its phased activation will effectively tackle the challenge, avoiding the pitfalls of superficial analysis.

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
