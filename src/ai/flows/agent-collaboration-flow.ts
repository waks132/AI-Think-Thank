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


// Step 1: Generate the collaboration log
const collaborationLogPrompt = ai.definePrompt({
  name: 'collaborationLogPrompt',
  input: {schema: AgentCollaborationInputSchema},
  output: {schema: z.object({ collaborationLog: z.array(CollaborationTurnSchema) })},
  prompt: `Your task is to simulate a collaboration between a **specific, predefined list** of specialized AI agents to accomplish a given mission.

**Mission:**
"{{{mission}}}"

**Participating Agents (Strictly Enforced):**
The simulation must **only** include agents from the following list. You **MUST NOT** add, invent, or include any agent not present in this list. The 'agentRole' in each output turn must exactly match one of the roles below.
{{{agentList}}}

**Your Process:**
1.  **Simulate Discussion:** Generate a plausible, turn-by-turn conversation **using only the agents listed above**. The discussion should show proposition, critique, and refinement.
2.  **Create Log:** For each turn, provide a **concise** agent's contribution (under 150 words) and a brief, insightful \`annotation\` describing its function (e.g., 'Proposes new synthesis', 'Critiques prior assumption').
3.  **Document:** Document every turn in the \`collaborationLog\` array, adhering strictly to the provided list of agents.

Produce ONLY the \`collaborationLog\` in the specified JSON format. Do not generate any other fields. Your entire response must be in this language: {{{language}}}.`,
});


// Step 2: Analyze the log and generate the summary, reasoning, and validation
const CollaborationAnalysisInputSchema = z.object({
  mission: z.string(),
  agentList: z.string(),
  collaborationLog: z.array(CollaborationTurnSchema),
  language: z.enum(['fr', 'en']),
});

const CollaborationAnalysisOutputSchema = z.object({
    executiveSummary: z.string().describe('A structured executive summary of the final proposed framework or solution, formatted with clear headings and bullet points.'),
    reasoning: z.string().describe('A step-by-step reasoning of how the agents interacted, their key contributions, and how the final synthesis was achieved.'),
    validationGrid: ValidationCriteriaSchema.describe("An assessment grid from the orchestrator's perspective, scoring the final output on multiple axes (from 0.0 to 1.0)."),
});

const collaborationAnalysisPrompt = ai.definePrompt({
    name: 'collaborationAnalysisPrompt',
    input: { schema: CollaborationAnalysisInputSchema },
    output: { schema: CollaborationAnalysisOutputSchema },
    prompt: `You are a master orchestrator of a cognitive collective of AI agents. You have just observed a collaboration. Your task is to analyze the provided log and produce a final report.

**Original Mission:**
"{{{mission}}}"

**Participating Agents:**
{{{agentList}}}

**Full Collaboration Log:**
\`\`\`json
{{{json collaborationLog}}}
\`\`\`

**Your Analysis Process:**
1.  **Synthesize Outcome:** Based on the provided collaboration log, produce a comprehensive \`executiveSummary\`. This should be a final, actionable output that accomplishes the mission, formatted as a structured plan with clear headings and bullet points. **Do not just summarize the conversation; extract and formalize the final proposed solution.**
2.  **Provide Reasoning:** Detail the \`reasoning\` behind the collaboration. Explain the key contributions of each agent as seen in the log, how conflicts were resolved, and how the final summary was synthesized from the discussion.
3.  **Validate Outcome:** As the orchestrator, score the final output from 0.0 to 1.0 on the criteria defined in the \`validationGrid\`. Provide a holistic assessment of the collective intelligence performance based on the log.

Produce your response in the specified JSON format. Your entire response, including all text fields, must be in this language: {{{language}}}.`
});


const agentCollaborationFlow = ai.defineFlow(
  {
    name: 'agentCollaborationFlow',
    inputSchema: AgentCollaborationInputSchema,
    outputSchema: AgentCollaborationOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the collaboration log
    const logResponse = await collaborationLogPrompt(input, {
      model: input.model,
      config: { maxOutputTokens: 7500 }
    });
    const collaborationLog = logResponse.output?.collaborationLog;
    if (!collaborationLog) {
        throw new Error("Failed to generate collaboration log.");
    }
    
    // Step 2: Generate the analysis from the log
    const analysisResponse = await collaborationAnalysisPrompt({
        ...input,
        collaborationLog,
    }, {
        model: input.model,
        config: { maxOutputTokens: 4096 } // Can be smaller now
    });

    const analysis = analysisResponse.output;
    if (!analysis) {
        throw new Error("Failed to generate collaboration analysis.");
    }
    
    // Step 3: Combine results
    return {
        ...analysis,
        collaborationLog,
    };
  }
);
