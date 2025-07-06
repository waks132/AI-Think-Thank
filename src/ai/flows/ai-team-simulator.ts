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
  perspectiveA: PerspectiveSchema,
  perspectiveB: PerspectiveSchema,
  numRounds: z
    .number()
    .describe('The number of simulation rounds to run.')
    .default(3),
});
export type CognitiveClashSimulatorInput = z.infer<typeof CognitiveClashSimulatorInputSchema>;

const RoundDetailSchema = z.object({
    round: z.number().describe('The round number.'),
    perspectiveA_action: z.string().describe("The action or argument made by Perspective A in this round."),
    perspectiveB_action: z.string().describe("The action or argument made by Perspective B in this round."),
    roundOutcome: z.string().describe("A summary of the round's outcome and its impact on the overall clash."),
});

const CognitiveClashSimulatorOutputSchema = z.object({
  clashSummary: z.string().describe("An executive summary of how the ideological clash unfolded over all rounds."),
  resilienceScore: z.number().min(0).max(1).describe("A score from 0.0 to 1.0 indicating the collective's ability to withstand the cognitive shock and find a stable resolution. 1.0 is highly resilient."),
  polarizationIndex: z.number().min(0).max(1).describe("A score from 0.0 to 1.0 indicating the degree of radicalization or divergence between the perspectives by the end of the simulation. 1.0 is highly polarized."),
  emergentSynthesis: z.string().describe("The final, synthesized resolution or diplomatic outcome that emerged from the clash. This could be a compromise, a stalemate, or one perspective winning."),
  roundDetails: z.array(RoundDetailSchema).describe("A detailed log of each round of the simulation."),
});
export type CognitiveClashSimulatorOutput = z.infer<typeof CognitiveClashSimulatorOutputSchema>;

export async function cognitiveClashSimulator(input: CognitiveClashSimulatorInput): Promise<CognitiveClashSimulatorOutput> {
  return cognitiveClashSimulatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cognitiveClashSimulatorPrompt',
  input: {schema: CognitiveClashSimulatorInputSchema},
  output: {schema: CognitiveClashSimulatorOutputSchema},
  prompt: `You are a sophisticated simulator of cognitive and ideological dynamics. Your task is to simulate a "Cognitive Clash" between two opposing perspectives within a collective of AI agents, based on a given scenario.

**Scenario:** {{{scenarioDescription}}}

**The Clashing Perspectives:**
1.  **Perspective A ({{perspectiveA.name}}):** Their core values are: "{{perspectiveA.values}}"
2.  **Perspective B ({{perspectiveB.name}}):** Their core values are: "{{perspectiveB.values}}"

**Simulation Parameters:**
*   **Rounds:** {{{numRounds}}}

**Your Mission:**
1.  **Simulate Round by Round:** For each of the {{{numRounds}}} rounds, generate a plausible action or argument for both Perspective A and Perspective B, based on their core values and the evolving state of the scenario. Then, describe the outcome of that specific round.
2.  **Analyze the Overall Clash:** After all rounds are complete, provide a holistic analysis.
    *   **Clash Summary:** Write a brief executive summary of the entire simulation.
    *   **Resilience Score:** Evaluate the system's resilience. Did the agents converge, find a compromise, or maintain stability? Score it from 0.0 (total collapse) to 1.0 (strong, stable synthesis).
    *   **Polarization Index:** Evaluate the final distance between the two perspectives. Did they become more extreme and entrenched in their views? Score it from 0.0 (full agreement/fusion) to 1.0 (irreconcilable radicalization).
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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
