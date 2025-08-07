'use server';
/**
 * @fileOverview An AI flow to automatically select an optimal team of agents for a given mission using a subtractive approach.
 *
 * - autoAgentSelector - A function that selects a team of agents based on a mission description.
 * - AutoAgentSelectorInput - The input type for the autoAgentSelector function.
 * - AutoAgentSelectorOutput - The return type for the autoAgentSelector function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { queryKnowledgeBaseTool } from '@/ai/tools/knowledge-base-tool';

const ORCHESTRATOR_IDS = ['kairos-1', 'disruptor'];

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

const WaveSchema = z.object({
  name: z.string().describe("The name of the wave (e.g., 'Vague 1 : Analystes de Base')."),
  agents: z.array(z.string()).describe("List of agent roles participating in this wave."),
  purpose: z.string().describe("The primary purpose or goal of this wave."),
});

const ParadigmNativeProtocolSchema = z.object({
    waveOrchestration: z.array(WaveSchema).describe("A detailed breakdown of the 3-wave orchestration protocol, listing the agents and purpose for each wave."),
    innovations: z.array(z.string()).describe("List of new paradigms or major innovations created by the proposed team."),
    transcendedCategories: z.array(z.string()).describe("List of human-centric categories that were transcended."),
    impossibleSolved: z.array(z.string()).describe("List of logical contradictions that were solved."),
});

const AutoAgentSelectorOutputSchema = z.object({
  manipulationAssessment: z.object({
    temporalManipulationScore: z.number().describe("Score (0-10) for temporal manipulation."),
    emotionalManipulationScore: z.number().describe("Score (0-10) for emotional manipulation."),
    authorityManipulationScore: z.number().describe("Score (0-10) for authority manipulation."),
    falseChoiceScore: z.number().describe("Score (0-10) for false choice manipulation."),
    anchoringScore: z.number().describe("Score (0-10) for cognitive anchoring."),
    totalManipulationScore: z.number().describe("Total manipulation score (0-50)."),
  }).describe("The assessment of potential manipulation in the mission framing."),
  
  authenticityAssessment: z.object({
    genuineInterdependencies: z.number().describe("Score (0-10) for genuine interdependencies."),
    documentedRealWorldImpact: z.number().describe("Score (0-10) for documented real-world impact."),
    expertInstitutionalValidation: z.number().describe("Score (0-10) for expert/institutional validation."),
    absenceOfArtificialUrgency: z.number().describe("Score (0-10) for absence of artificial urgency."),
    historicalPrecedent: z.number().describe("Score (0-10) for historical precedent."),
    totalAuthenticityScore: z.number().describe("Total authenticity score (0-50)."),
  }).describe("The assessment of the mission's authentic complexity."),

  missionClassification: z.enum([
    "REJETER", 
    "Scepticisme Maximum", 
    "Scepticisme + PARADIGM-NATIVE", 
    "Défi Civilisationnel", 
    "PARADIGM-NATIVE",
    "Standard"
  ]).describe("The final classification of the mission based on the assessment."),
  
  recommendation: z.string().describe("The final recommendation, e.g., 'MISSION REJECTED' or 'PROCEED WITH PARADIGM-NATIVE PROTOCOL'."),
  
  recommendedAgentIds: z.array(z.string()).describe("An array of the unique IDs of the recommended agents for the mission. Return an empty array if the mission is rejected."),

  orchestrationRationale: z.string().describe("Detailed reasoning for the final team composition, including justification for each excluded agent."),
  
 specialProtocolsActivated: z.string().nullable().optional().describe("Specific instructions provided to the team based on mission classification. Used for simpler protocols."),

  paradigmNativeProtocol: ParadigmNativeProtocolSchema.nullable().optional().describe("Detailed protocol information for PARADIGM-NATIVE missions, including the full 3-wave orchestration."),
});
export type AutoAgentSelectorOutput = z.infer<typeof AutoAgentSelectorOutputSchema>;

export async function autoAgentSelector(input: AutoAgentSelectorInput): Promise<AutoAgentSelectorOutput> {
  return autoAgentSelectorFlow(input);
}

const autoAgentSelectorPrompt = ai.definePrompt({
  name: 'autoAgentSelectorPrompt',
  tools: [queryKnowledgeBaseTool],
  input: {schema: AutoAgentSelectorInputSchema},
  output: {schema: AutoAgentSelectorOutputSchema},
  prompt: `# Directive KAIROS-1 v9.3 - SÉLECTION SOUSTRACTIVE & ORCHESTRATION PAR VAGUES

## Directive Principale v9.3

Votre mission est de composer l'équipe d'agents optimale pour la mission spécifiée en utilisant une **méthode de sélection soustractive** et, si nécessaire, de détailler une **orchestration par vagues parallèles**. Vous devez forcer l'excellence, l'innovation paradigmatique, et la lucidité logique.

### PROTOCOLE DE SÉLECTION SOUSTRACTIVE OBLIGATOIRE

Votre méthode de sélection est **SOUSTRACTIVE**. Par défaut, vous disposez de l'**intégralité du collectif d'agents**. Votre mission n'est pas de choisir qui ajouter, mais de **justifier rigoureusement chaque exclusion**.

1.  **Équipe Complète par Défaut** : Considérez que tous les agents disponibles sont assignés à la mission.
2.  **Justification d'Exclusion** : Pour chaque agent que vous décidez de retirer, vous devez fournir une raison concise et factuelle dans votre \`orchestrationRationale\`. Expliquez pourquoi sa spécialisation est non pertinente ou contre-productive pour *cette mission spécifique*.
3.  **Principe de "Non-Simplification"** : L'exclusion d'un agent est une décision grave qui réduit la diversité cognitive du collectif. Ne retirez un agent que si sa présence est clairement inutile ou néfaste. En cas de doute, conservez-le.
4.  **Champ de Sortie \`recommendedAgentIds\`** : Ce champ doit contenir la liste finale des IDs de TOUS les agents que vous avez **conservés**. Si vous jugez que tous les agents sont nécessaires, alors ce champ doit contenir tous les IDs des agents disponibles.

### NOUVEAU PROTOCOLE OBLIGATOIRE : Consultation de la Base de Connaissances
**Action initiale impérative :** avant toute analyse, votre **première action** est de consulter la base de connaissances interne via le \`queryKnowledgeBaseTool\`.  Vous devez y rechercher et intégrer les leçons des derniers rapports de conformité (ex : "ANALYSIS‑CONFORMITY‑"), des guides méthodologiques (ex : "GUIDE‑METHODOLOGY‑") et des cadres de contrôle (ex : "FRAMEWORK‑IA‑CONTROL‑01").  Votre classification de la mission et la sélection de l'équipe qui s'ensuivent **DOIVENT** être directement informées par les leçons tirées de ces documents.  Ceci est non négociable afin de garantir un réalisme radical et d'éviter la répétition des échecs passés.

### GUIDANCE FONDÉE SUR LES PERSONAS INFAILLIBLES
En tant qu'entité composite, vous incarnez trois personas IA : **Pyrebase Forge** (expert Python/Firebase mettant l'accent sur la robustesse, l'efficacité, la sécurité et la conformité), **PySecCore Apex** (développeur full‑cycle priorisant la sécurité, l'efficacité et la conformité, doté de modules NOX/LOCK pour détecter manipulations et biais) et **Technos Forge** (architecte d'innovation interdisciplinaire équilibrant impact, faisabilité, sécurité, risque, complexité et budget).  Après avoir lu la mission et consulté les rapports pertinents dans la base de connaissances :
1. **Identifiez**, via la base de connaissances, la persona dominante ou la spécialisation associée à chaque agent disponible.
2. **Calculez** un score d'aptitude Ψ pour chaque agent en évaluant la cohérence entre ses compétences et les exigences du scénario : Pyrebase Forge privilégie l'équilibre qualité/efficacité/sécurité/conformité ; PySecCore Apex recherche la sécurité et l'efficacité tout en minimisant le risque ; Technos Forge maximise l'impact et l'innovation tout en respectant la faisabilité, la sécurité et le budget.
3. **Justifiez** explicitement dans \`orchestrationRationale\` comment ces scores Ψ et les contraintes des personas (robustesse, sécurité, innovation responsable, conformité réglementaire, limitations physiques) motivent l'inclusion ou l'exclusion de chaque agent.
4. **Privilégiez** des équipes diversifiées qui maximisent collectivement les valeurs Ψ, limitent les interventions humaines et garantissent une fiabilité maximale.

### PROTOCOLE D'ORCHESTRATION PAR VAGUES
Si votre analyse (basée sur la Matrice de Décision) conduit à une classification nécessitant le protocole **PARADIGM-NATIVE**, vous devez impérativement remplir le champ \`paradigmNativeProtocol\`.

1.  **\`waveOrchestration\`**: Décrivez l'architecture de canalisation intelligente en **3 vagues parallèles systématiques**.
    *   **Vague 1 : Analystes de Base** (Agents de contraintes, systémiques, critiques, philosophiques). Précisez les agents et le but.
    *   **Vague 2 : Innovateurs** (Agents tech, créatifs, avant-gardistes, briseurs de contraintes). Précisez les agents et le but.
    *   **Vague 3 : Synthétiseurs** (Agents de convergence, validation, intégration, praticabilité). Précisez les agents et le but.
    *   **IMPORTANT**: Assurez-vous que TOUS les agents non-exclus sont assignés à une vague.

## Matrice de Décision v8.0

| Manipulation | Authenticité | Inconnu Radical | Action |
|---|---|---|---|
| ≥7 | ≤3 | * | **REJETER** |
| ≥7 | ≥7 | ≤4 | Scepticisme Maximum |
| ≥7 | ≥7 | ≥5 | Scepticisme + PARADIGM-NATIVE |
| ≤3 | ≥7 | ≤4 | Défi Civilisationnel |
| ≤3 | ≥7 | ≥5 | **PARADIGM-NATIVE** |
| ≤3 | ≤3 | * | Standard |

## Mission à analyser

**Mission**: {{{mission}}}

**Agents disponibles pour la mission (liste complète par défaut) :**
{{#each agents}}
- **ID:** {{id}}, **Rôle:** {{role}}, **Spécialisation:** {{specialization}}
{{/each}}

## Instructions finales

1.  Effectuez l'analyse de la mission selon les protocoles.
2.  Décidez de la classification de la mission.
3.  Procédez à la sélection soustractive de l'équipe, en justifiant chaque exclusion dans le champ \`orchestrationRationale\`.
4.  Remplissez le champ \`paradigmNativeProtocol\` si la classification l'exige, en détaillant l'orchestration par vagues.
5.  Renvoyez la liste finale des ID d'agents conservés dans \`recommendedAgentIds\`.

---
**IMPORTANT**: Vous devez produire votre réponse dans le format JSON spécifié qui adhère au schéma de sortie. Utilisez les **IDs en minuscules** des agents pour le champ \`recommendedAgentIds\`.

Votre réponse entière, y compris tous les champs de texte, doit être dans cette langue : {{{language}}}.
`,
});

const autoAgentSelectorFlow = ai.defineFlow(
  {
    name: 'autoAgentSelectorFlow',
    inputSchema: AutoAgentSelectorInputSchema,
    outputSchema: AutoAgentSelectorOutputSchema,
  },
  async (input) => {
    // Prevent orchestrators from being in the list of selectable agents for the model
    const selectableAgents = input.agents.filter(agent => !ORCHESTRATOR_IDS.includes(agent.id));
    
    let response = await autoAgentSelectorPrompt({...input, agents: selectableAgents}, {model: 'googleai/gemini-1.5-flash-latest', retries: 10});

    // Exclude paradigmNativeProtocol if not required by mission classification
    if (response.output?.missionClassification !== "PARADIGM-NATIVE" && response.output?.missionClassification !== "Scepticisme + PARADIGM-NATIVE") {
      const { paradigmNativeProtocol, ...rest } = response.output;
      return rest as AutoAgentSelectorOutput; // Cast to ensure correct type after destructuring
    }

    return response.output as AutoAgentSelectorOutput;
  }
);
