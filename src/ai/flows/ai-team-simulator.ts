'use server';
/**
 * @fileOverview Implements the Cognitive Clash simulation flow.
 *
 * - cognitiveClashSimulator - A function that runs the Cognitive Clash simulation.
 * - CognitiveClashSimulatorInput - The input type for the cognitiveClashSimulator function.
 * - CognitiveClashSimulatorOutput - The return type for the cognitiveClashSimulator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerspectiveSchema = z.object({
  name: z.string().describe("The name of the perspective or ideological group (e.g., 'Radical Innovation Faction')."),
  values: z.string().describe("The core values, beliefs, and strategy of this perspective (e.g., 'Move fast and break things, disruption is always positive, legacy systems must be dismantled.').")
});

const CognitiveClashSimulatorInputSchema = z.object({
  scenarioDescription: z
    .string()
    .describe('A detailed description of the scenario causing the cognitive clash.'),
  perspectives: z.array(PerspectiveSchema).min(2).describe("The ideological perspectives participating in the clash."),
  numRounds: z
    .number()
    .describe('The number of simulation rounds to run.')
    .default(3),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type CognitiveClashSimulatorInput = z.infer<typeof CognitiveClashSimulatorInputSchema>;

const ArgumentSchema = z.object({
  position: z.string().describe("The core stance or statement being made in this turn."),
  justification: z.string().describe("The reasoning or evidence supporting the position."),
  riskPerceived: z.string().describe("The primary risk or downside this perspective identifies with opposing views or the current situation."),
  proposal: z.string().describe("The concrete action or proposition being put forward in this turn."),
});

const ClashTurnSchema = z.object({
    turn: z.number().describe('The turn number in the debate.'),
    perspectiveName: z.string().describe("The name of the perspective speaking."),
    argument: ArgumentSchema.describe("The structured argument made by the perspective in this turn."),
});

const CognitiveClashSimulatorOutputSchema = z.object({
  clashSummary: z.string().describe("An executive summary of how the ideological clash unfolded over all rounds."),
  resilienceScore: z.number().min(0).max(1).describe("A score from 0.0 to 1.0 indicating the collective's ability to withstand the cognitive shock and find a stable resolution. 1.0 is highly resilient."),
  polarizationIndex: z.number().min(0).max(1).describe("A score from 0.0 to 1.0 indicating the degree of radicalization or divergence between the perspectives by the end of the simulation. 1.0 is highly polarized."),
  emergentSynthesis: z.string().describe("The final, synthesized resolution or diplomatic outcome that emerged from the clash. This could be a compromise, a stalemate, or one perspective winning."),
  simulationLog: z.array(ClashTurnSchema).describe("A detailed turn-by-turn log of the simulation, showing each perspective's structured argument sequentially."),
});
export type CognitiveClashSimulatorOutput = z.infer<typeof CognitiveClashSimulatorOutputSchema>;

export async function cognitiveClashSimulator(input: CognitiveClashSimulatorInput): Promise<CognitiveClashSimulatorOutput> {
  return cognitiveClashSimulatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cognitiveClashSimulatorPrompt',
  input: {schema: CognitiveClashSimulatorInputSchema},
  output: {schema: CognitiveClashSimulatorOutputSchema},
  prompt: `You are a sophisticated simulator of cognitive and ideological dynamics. Your task is to simulate a "Cognitive Clash" between multiple opposing perspectives based on a given scenario.

**Scenario:** {{{scenarioDescription}}}

**The Clashing Perspectives:**
{{#each perspectives}}
- **Perspective Name:** {{name}}
  **Core Values:** "{{values}}"
{{/each}}

**Simulation Parameters:**
*   **Rounds:** {{{numRounds}}} (A round consists of each perspective making an argument).

**Your Mission:**
1.  **Simulate the Debate:** Generate a plausible, turn-by-turn debate. The total number of turns should be roughly the number of perspectives times the number of rounds. The discussion should show proposition, critique, and refinement. A mediating perspective should attempt to find common ground.
2.  **Structure the Arguments:** For each turn in the \`simulationLog\`, you MUST formalize the argument using the following structure: \`{ position, justification, riskPerceived, proposal }\`. Ensure every field is filled with a meaningful, non-trivial statement reflecting the persona's move.
3.  **Analyze the Overall Clash:** After the debate is complete, provide a holistic analysis.
    *   **Clash Summary:** Write a brief executive summary of the entire simulation.
    *   **Resilience Score:** Evaluate the system's resilience. Did the agents converge, find a compromise, or maintain stability? Score it from 0.0 (total collapse) to 1.0 (strong, stable synthesis).
    *   **Polarization Index:** Evaluate the final distance between the perspectives. Did they become more extreme and entrenched in their views? Score it from 0.0 (full agreement/fusion) to 1.0 (irreconcilable radicalization).
    *   **Emergent Synthesis:** Describe the final state of the system. What is the resolution? Is it a creative compromise, a clear victory for one side, a stalemate, or a complete breakdown in communication?

Produce your entire analysis in the specified JSON format.
`,
});

const cognitiveClashSimulatorFlow = ai.defineFlow(
  {
    name: 'cognitiveClashSimulatorFlow',
    inputSchema: CognitiveClashSimulatorInputSchema,
    outputSchema: CognitiveClashSimulatorOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, {model: input.model});
    return output!;
  }
);
