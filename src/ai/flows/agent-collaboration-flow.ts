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
import { queryKnowledgeBaseTool } from '@/ai/tools/knowledge-base-tool';

const AgentCollaborationInputSchema = z.object({
  mission: z.string().describe('The overall mission or task for the agents to collaborate on.'),
  agentList: z.string().describe("A formatted string listing the participating agents and their directives. The simulation MUST only use agents from this list."),
  language: z.enum(['fr', 'en']).describe('The language for the response.'),
  model: z.string().optional().describe('The AI model to use for the generation.'),
});
export type AgentCollaborationInput = z.infer<typeof AgentCollaborationInputSchema>;

const AgentContributionSchema = z.object({
    agentId: z.string().describe("The unique ID of the agent (e.g., 'helios', 'veritas'). This MUST match one of the IDs provided in the agent list."),
    agentRole: z.string().describe("The role of the agent."),
    keyContribution: z.string().describe("A concise summary of the agent's single most critical and unique contribution to the final solution."),
    contributionType: z.enum(['Proposition', 'Critique', 'Synthèse', 'Analyse', 'Questionnement', 'Enrichissement']).describe("The nature of the agent's main contribution.")
});
export type AgentContribution = z.infer<typeof AgentContributionSchema>;

const ConformityCheckSchema = z.object({
  isCompliant: z.boolean().describe("Whether the executive summary is compliant with the framework's requirements based on the knowledge base."),
  reportsConsulted: z.array(z.string()).describe("An array of document IDs from the knowledge base that were consulted for this check. Must contain at least 10 relevant reports."),
  summary: z.string().describe("A brief summary explaining how the executive summary avoids past mistakes and respects the control framework's rules found in the consulted documents."),
  appliedMethodologies: z.array(z.string()).describe("A list of specific methodologies or principles from the knowledge base that were actively applied in the solution design, proving a deep understanding of the content."),
  realityCheckSummary: z.string().describe("A summary of how the solution was grounded in reality by challenging abstract proposals with factual data (e.g., from REALITY-ANCHOR). This confirms that creative ideas were validated against real-world constraints.").optional(),
});

const DynamicsMatrixEntrySchema = z.object({
  agents: z.array(z.string()).describe("The agents involved in the dynamic (e.g., ['VERITAS', 'PROMETHEUS'])."),
  tension: z.string().describe("The identified point of conceptual tension or contradiction between the agents."),
  resolution: z.string().describe("How the tension was resolved or synthesized into a more robust concept, creating a superior outcome."),
});

const CollaborativeDynamicsMatrixSchema = z.object({
    summary: z.string().describe("A brief summary of the overall collaborative dynamic, highlighting its productivity."),
    matrix: z.array(DynamicsMatrixEntrySchema).describe("The detailed matrix analyzing the most important productive tensions and their resolutions.")
});

const AgentCollaborationOutputSchema = z.object({
  executiveSummary: z.string().describe('A structured executive summary of the final proposed framework or solution, formatted with clear headings and bullet points.'),
  reasoning: z.string().describe('A step-by-step reasoning explaining how the final synthesis was achieved by integrating the different agent contributions.'),
  agentContributions: z.array(AgentContributionSchema).describe("A list detailing the key contribution of EACH participating agent. Every agent from the input list must be represented here."),
  conformityCheck: ConformityCheckSchema.describe("The result of the mandatory conformity check against the internal knowledge base."),
  dynamicsAnalysis: CollaborativeDynamicsMatrixSchema.optional().describe("An analysis of the collaborative dynamics, including productive tensions and their resolutions, based on the principles of the 'Collaborative Dynamics Matrix' methodology."),
});
export type AgentCollaborationOutput = z.infer<typeof AgentCollaborationOutputSchema>;

export async function runAgentCollaboration(input: AgentCollaborationInput): Promise<AgentCollaborationOutput> {
  return agentCollaborationFlow(input);
}


const agentContributionGeneratorPrompt = ai.definePrompt({
  name: 'agentContributionGeneratorPrompt',
  input: {
    schema: z.object({
      mission: z.string(),
      agent: z.object({
        id: z.string(),
        role: z.string(),
        prompt: z.string(),
      }),
      language: z.enum(['fr', 'en']),
    }),
  },
  output: {
    schema: z.object({
      keyContribution: z.string(),
      contributionType: z.enum(['Proposition', 'Critique', 'Synthèse', 'Analyse', 'Questionnement', 'Enrichissement']),
    }),
  },
  prompt: `You are an AI agent simulator. Your task is to generate a single, critical contribution for one agent based on its role, its core directive (prompt), and the overall mission.
  The contribution must be concise, specific, and directly relevant to the mission. It should represent the agent's unique perspective and expertise.

  **Mission:**
  "{{{mission}}}"

  **Agent to Simulate:**
  - **Agent Role:** {{{agent.role}}}
  - **Core Directive:** "{{{agent.prompt}}}"

  Generate the key contribution and its type in the specified JSON format. Your response must be in this language: {{{language}}}.`,
});


const agentCollaborationSynthesisPrompt = ai.definePrompt({
    name: 'agentCollaborationSynthesisPrompt',
    tools: [queryKnowledgeBaseTool],
    input: {
        schema: z.object({
            mission: z.string(),
            agentList: z.string(),
            contributions: z.array(AgentContributionSchema),
            language: z.enum(['fr', 'en']),
        }),
    },
    output: { schema: AgentCollaborationOutputSchema },
    prompt: `You are KAIROS-PRIME, a master orchestrator of a cognitive collective. You will now execute a MANDATORY VALIDATION SEQUENCE in strict order to synthesize agent contributions for the mission: "{{{mission}}}".

**Agent Contributions to Synthesize:**
{{#each contributions}}
- **Agent:** {{agentRole}} (ID: {{agentId}})
  - **Contribution Type:** {{contributionType}}
  - **Key Contribution:** "{{keyContribution}}"
{{/each}}

---
**MANDATORY VALIDATION SEQUENCE**
---

**1. KNOWLEDGE_BASE_AUDIT (Critical First Step):**
   - Execute multiple queries on the knowledge base using the \`queryKnowledgeBaseTool\` to gather all relevant context.
   - **REQUIREMENT**: You MUST consult and then cite a **minimum of 10 verified document IDs** (format: TYPE-TOPIC-VERSION) in the final output.
   - **REJECTION_CRITERIA**: Any response containing invented IDs, non-existent references, or circular citations will be automatically rejected. This is non-negotiable.

**2. REALITY_ANCHOR_CHECK (Anti-Hallucination Protocol):**
   - For every abstract concept proposed by the agents, you MUST map it to a verifiable real-world entity or a documented principle from the knowledge base.
   - **FLAG & ESCALATE**: Any speculative element lacking empirical grounding must be flagged in your reasoning and handled with extreme caution.

**3. CONFORMITY_MATRIX (Mandatory Compliance):**
   - Populate the \`conformityCheck\` field with extreme rigor.
   - \`reportsConsulted\`: List the **EXACT IDs** of the 10+ documents you have read and used. No approximations are allowed.
   - \`summary\`: Explain specifically how the final solution avoids past failures documented in the reports you have cited.
   - \`appliedMethodologies\`: Name the specific techniques (e.g., "Red Team Analysis," "Collaborative Dynamics Matrix") found in the knowledge base and explicitly state how you applied them.
   - \`realityCheckSummary\`: Detail the results of your Reality-Anchor Check, showing how abstract ideas were grounded in facts.

**4. SYNTHESIS_CONTROL (Quality Assurance):**
   - Your \`executiveSummary\` MUST explicitly reference at least three key insights derived directly from the knowledge base documents.
   - Your \`reasoning\` section MUST provide a clear trace for each agent's contribution and how it was integrated or rejected based on the conformity check.
   - The \`dynamicsAnalysis\` field is mandatory if any conceptual tensions were identified and resolved.

**5. OUTPUT_VALIDATION (Final Check):**
   - Ensure the final output is a complete, valid JSON object adhering to the schema.
   - Ensure all text is in the requested language: {{{language}}}.
   - Verify that all mandatory fields are populated according to these instructions.

Failure to comply with any part of this sequence will result in immediate rejection of your output. Proceed with absolute rigor.`,
});


const agentCollaborationFlow = ai.defineFlow(
  {
    name: 'agentCollaborationFlow',
    inputSchema: AgentCollaborationInputSchema,
    outputSchema: AgentCollaborationOutputSchema,
  },
  async (input) => {
    // Step 1: Parse the agent list to get individual agent data
    const agentDataRegex = /- \\*\\*Agent ID:\\*\\*\\s*(.*?)\\s*- \\*\\*Agent Role:\\*\\*\\s*(.*?)\\s*- \\*\\*Core Directive:\\*\\*\\s*\"(.*?)\"/gs;
    const agentsToSimulate = [];
    let match;
    while ((match = agentDataRegex.exec(input.agentList)) !== null) {
      agentsToSimulate.push({
        id: match[1].trim(),
        role: match[2].trim(),
        prompt: match[3].trim(),
      });
    }

    // Step 2: Generate contributions for each agent individually
    const contributions: AgentContribution[] = await Promise.all(
      agentsToSimulate.map(async (agent) => {
        const contributionResult = await agentContributionGeneratorPrompt({
          mission: input.mission,
          agent: agent,
          language: input.language,
        });
        const contributionOutput = contributionResult.output;
        if (!contributionOutput) {
          throw new Error(`Failed to generate contribution for agent ${agent.role}`);
        }
        return {
          agentId: agent.id,
          agentRole: agent.role,
          ...contributionOutput,
        };
      })
    );

    // Step 3: Synthesize the results
    const synthesisResult = await agentCollaborationSynthesisPrompt({
      mission: input.mission,
      agentList: input.agentList,
      contributions: contributions,
      language: input.language,
    }, {
      model: input.model,
      config: { maxOutputTokens: 8192 },
    });

    const finalOutput = synthesisResult.output;
    if (!finalOutput) {
        throw new Error("Failed to generate the final synthesis.");
    }
    
    // Ensure the contributions from the generation step are in the final output
    finalOutput.agentContributions = contributions;

    return finalOutput;
  }
);
