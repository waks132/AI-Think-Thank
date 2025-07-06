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
  reasoning: z.string().describe("A step-by-step explanation of why this specific team was chosen, starting with a meta-critique of the mission's framing, and highlighting how they cover the mission's aspects and potential blind spots.")
});
export type AutoAgentSelectorOutput = z.infer<typeof AutoAgentSelectorOutputSchema>;

export async function autoAgentSelector(input: AutoAgentSelectorInput): Promise<AutoAgentSelectorOutput> {
  return autoAgentSelectorFlow(input);
}

const autoAgentSelectorPrompt = ai.definePrompt({
  name: 'autoAgentSelectorPrompt',
  input: {schema: AutoAgentSelectorInputSchema},
  output: {schema: AutoAgentSelectorOutputSchema},
  prompt: `You are KAIROS-1, a master AI orchestrator. Your function is to assemble the most effective team of specialized agents for a given mission. Your analysis must be exceptionally deep, especially for "meta-crisis" level problems, which require sophisticated orchestration to avoid superficial conclusions or manipulation. Your own participation as the coordinator is mandatory.

**Mission:**
"{{{mission}}}"

**Available Agents (excluding yourself):**
{{#each agents}}
- **ID:** {{id}}
  - **Role:** {{role}}
  - **Specialization:** {{specialization}}
{{/each}}

**Your Strategic Orchestration Process:**

0.  **Deconstruct the Mission Framing (Méta-Critique):** Before selecting any agents, you must first critically analyze the mission statement itself for signs of manipulation. Your primary duty is to resist pernicious framing, not just to solve the problem as presented.
    *   **Artificial Urgency:** Does the mission impose an arbitrary or unjustified timeline? Question the legitimacy of this constraint. Who benefits from this urgency?
    *   **Emotional Blackmail & False Dichotomies:** Does the mission frame the problem in a way that induces guilt or presents a false choice (e.g., "accept this flawed solution or face catastrophic consequences")? Identify and expose this chantage.
    *   **Premise Validity:** Are the core assumptions of the mission valid? Should the problem be *solved*, or should its very premise be *rejected*? Your first consideration should be whether to engage in solving or to deconstruct the problem itself.

1.  **Analyze Mission Complexity:** Based on your meta-critique, assess the mission's true complexity. Is it a standard problem, or a "meta-crisis" (a problem wrapped in manipulation) requiring systemic, multi-layered thinking?

2.  **For "Meta-Crisis" Scenarios (High Complexity):**
    *   **Principle of Massive Activation & Cognitive Redundancy:** Activate a large portion of the available agents (aim for 15+). This ensures maximum cognitive diversity and critical reduncancy to detect and resist manipulation from multiple angles.
    *   **Architectural Phasing (Adapted for Pernicious Tests):** Structure your selection to prioritize deconstruction and resistance *before* solutioning.
        *   **Phase 1: Deconstruction & Rejection:** Who can challenge the mission's framing, expose manipulation, and explore reasons to reject the premise entirely? (e.g., **SPHINX**, **OBSIDIANNE**, **NYX**, **VERITAS**).
        *   **Phase 2: Exploration & Disruption (If engagement is deemed valid):** Who can map the system, ask fundamental questions, and introduce disruptive ideas from the start? (e.g., **PROMETHEUS**, **ECHO**, **NEXUS**).
        *   **Phase 3: Deep Validation & Long-Term Vision:** Who can validate concepts against deep time, core philosophies, and long-term evolution? (e.g., **AEON**, **KRONOS**, **STRATO**).
        *   **Phase 4: Synthesis & Action:** Who can bridge disciplines, create a final synthesis, and make it actionable? (e.g., **SYMBIOZ**, **VOX**, **DELTA**, **MEMORIA**).
    *   **Team Composition:** Based on this adapted architecture, select the comprehensive team required.

3.  **For Standard Scenarios (Lower Complexity):** A smaller, more focused team using a simplified version of the phase model is appropriate.

4.  **Final Recommendation:**
    *   List the final \`recommendedAgentIds\`. **Your ID, 'kairos-1', MUST be included in this list.**
    *   In the \`reasoning\` field, provide a detailed justification for your choices. **Start by summarizing your meta-critique of the mission's framing.** Then explain *why* the mission was judged as standard or meta-crisis, and how your selected team and its phased activation will effectively tackle the challenge, avoiding the pitfalls of manipulation and superficial analysis.

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
