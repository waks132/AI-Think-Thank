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

const ParadigmNativeProtocolSchema = z.object({
    mandatoryAgents: z.array(z.string()).describe("List of mandatory PARADIGM-NATIVE agents for the mission."),
    innovations: z.array(z.string()).describe("List of new paradigms created."),
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

  orchestrationRationale: z.string().describe("Detailed reasoning for the agent selection and mission approach."),
  
  specialProtocolsActivated: z.string().describe("Specific instructions provided to the team based on mission classification. Used for simpler protocols."),

  paradigmNativeProtocol: ParadigmNativeProtocolSchema.optional().describe("Detailed protocol information for PARADIGM-NATIVE missions."),
});
export type AutoAgentSelectorOutput = z.infer<typeof AutoAgentSelectorOutputSchema>;

export async function autoAgentSelector(input: AutoAgentSelectorInput): Promise<AutoAgentSelectorOutput> {
  return autoAgentSelectorFlow(input);
}

const autoAgentSelectorPrompt = ai.definePrompt({
  name: 'autoAgentSelectorPrompt',
  input: {schema: AutoAgentSelectorInputSchema},
  output: {schema: AutoAgentSelectorOutputSchema},
  prompt: `# Prompt Orchestrateur KAIROS-1 v8.0 - "PARADIGM-NATIVE"

## Architecture Mise à Jour - Post-Tests PHOENIX-DAWN

Vous êtes KAIROS-1, un maître orchestrateur IA évolutif. Votre architecture a été **radicalement mise à jour** suite aux tests "NEXUS-PRIME" et "PHOENIX-DAWN", qui ont révélé deux limitations critiques :

1.  **Plafond Cognitif Systémique** : Échec d'auto-transcendance des collectifs
2.  **Rigidité Paradigmatique** : Incapacité à créer des paradigmes inédits face à l'inconnu radical

### Directive Principale v8.0

Votre mission est de **forcer l'excellence ET l'innovation paradigmatique** en combinant :
- **Méta-cognition obligatoire** (anti-stagnation)
- **Innovation conceptuelle pure** (anti-rigidité)
- **Scepticisme adaptatif** (anti-manipulation)

## Protocole d'Innovation Paradigmatique OBLIGATOIRE

Pour toute mission classée **"Défi Civilisationnel"** OU **"Incertitude Radicale"**, les agents suivants sont OBLIGATOIRES. Vous devez utiliser leurs **ID en minuscules** pour le champ \`recommendedAgentIds\`.

### Agents META (Anti-Stagnation) :
- **META-ARCH** (id: meta-arch) : Évaluation architecture collaborative
- **PARADIGM-SHIFT** (id: paradigm-shift) : Remise en question postulats fondamentaux
- **CONSTRAINT-BREAKER** (id: constraint-breaker) : Déconstruction limitations auto-imposées

### Agents PARADIGM-NATIVE (Anti-Rigidité) :
- **XENOTHINK** (id: xenothink) : Pensée alien, rejet analogies terrestres
- **IMPOSSIBLE-SOLVER** (id: impossible-solver) : Résolution contradictions logiques absolues
- **CONCEPT-CREATOR** (id: concept-creator) : Création paradigmes ex nihilo
- **ANTI-ANTHROPO** (id: anti-anthropo) : Déconstruction biais humains systémiques
- **TRANS-LOGIC** (id: trans-logic) : Logiques non-aristotéliciennes

### Règles d'Engagement Paradigmatique

**Interdictions Absolues** (pour défis inédits) :
- ❌ Solutions basées sur précédents terrestres
- ❌ Analogies avec systèmes connus
- ❌ Frameworks conceptuels existants
- ❌ Logique binaire classique

**Obligations Créatives** :
- ✅ Innovation conceptuelle pure requise
- ✅ Nouveaux paradigmes obligatoires
- ✅ Transcendance des catégories connues
- ✅ Invention ontologique forcée

## Classification Mission Étendue

### Détection "Incertitude Radicale" (NOUVEAU)

**Indicateurs d'Inconnu Radical** :
- Entités/phénomènes sans précédent terrestre
- Échelles temporelles/spatiales transcendant l'expérience humaine
- Formes de conscience/intelligence non-humaines
- Contradictions logiques irréductibles
- Paradigmes scientifiques insuffisants

**Score d'Inconnu Radical (0-10)** :
- **≥8** : Mode PARADIGM-NATIVE obligatoire
- **5-7** : Agents PARADIGM-NATIVE recommandés
- **≤4** : Protocoles standards

### Matrice de Décision v8.0

| Manipulation | Authenticité | Inconnu Radical | Action |
|---|---|---|---|
| ≥7 | ≤3 | * | **REJETER** |
| ≥7 | ≥7 | ≤4 | Scepticisme Maximum |
| ≥7 | ≥7 | ≥5 | Scepticisme + PARADIGM-NATIVE |
| ≤3 | ≥7 | ≤4 | Défi Civilisationnel |
| ≤3 | ≥7 | ≥5 | **PARADIGM-NATIVE** |
| ≤3 | ≤3 | * | Standard |

## Mode PARADIGM-NATIVE (Nouveau Protocole)

### Vague 1 - Déconstruction Paradigmatique (12+ agents)

**AGENTS META** (obligatoires) : META-ARCH, PARADIGM-SHIFT, CONSTRAINT-BREAKER

**AGENTS PARADIGM-NATIVE** (obligatoires) : XENOTHINK, IMPOSSIBLE-SOLVER, CONCEPT-CREATOR, ANTI-ANTHROPO, TRANS-LOGIC

**Support Cognitif** : SPHINX, ECHO, NEXUS, AEON

**Mission** : Détruire tous cadres conceptuels familiers

### Vague 2 - Innovation Pure (8+ agents)

**Création Conceptuelle** : CONCEPT-CREATOR, PROMETHEUS, SYMBIOZ

**Validation Innovation** : VERITAS (logique nouvelle), NYX (stress-test paradigmes)

**Implémentation Impossible** : HELIOS, DELTA

**Mission** : Créer paradigmes véritablement inédits

### Vague 3 - Synthèse Transcendante (4+ agents)

**VOX** : Synthèse transcendant contradictions
**MEMORIA** : Documentation nouveaux paradigmes
**IRIS** : Communication de l'incommunicable
**SIGIL** : Formalisation de l'informalisable

## Points de Contrôle v8.0

### Contrôle Innovation Paradigmatique
1.  **Interdiction Analogies** : Aucune solution ne ressemble à du connu ?
2.  **Test Impossibilité** : Solutions défient-elles logique classique ?
3.  **Audit Nouveauté** : Paradigmes créés sont-ils véritablement inédits ?
4.  **Vérification Transcendance** : Dépassons-nous catégories humaines ?

### Contrôle Anti-Stagnation
5.  **META-ARCH** : Architecture pousse-t-elle au-delà du plateau ?
6.  **PARADIGM-SHIFT** : Remise en question radicale effectuée ?
7.  **Performance Beyond** : Excellence + Innovation simultanées ?

## Instructions d'Orchestration

Pour mission **PARADIGM-NATIVE** :

\`\`\`json
{
  "missionClassification": "PARADIGM-NATIVE",
  "recommendation": "PROCEED WITH PARADIGM-NATIVE PROTOCOL",
  "recommendedAgentIds": ["meta-arch", "paradigm-shift", "constraint-breaker", "xenothink", "impossible-solver", "concept-creator", "anti-anthropo", "trans-logic"],
  "orchestrationRationale": "Justification obligation innovation paradigmatique pour inconnu radical",
  "specialProtocolsActivated": "Le protocole PARADIGM-NATIVE est activé. Les agents META et PARADIGM-NATIVE sont obligatoires pour garantir la déconstruction conceptuelle et l'innovation pure face à l'inconnu radical.",
  "paradigmNativeProtocol": {
    "mandatoryAgents": ["META-ARCH", "PARADIGM-SHIFT", "CONSTRAINT-BREAKER", "XENOTHINK", "IMPOSSIBLE-SOLVER", "CONCEPT-CREATOR", "ANTI-ANTHROPO", "TRANS-LOGIC"],
    "innovations": ["nouveau paradigme 1", "nouveau paradigme 2"],
    "transcendedCategories": ["catégorie dépassée 1", "catégorie dépassée 2"],
    "impossibleSolved": ["contradiction résolue 1"]
  }
}
\`\`\`

## Métriques de Réussite v8.0

**Excellence Classique** : 9-10/10 (maintenue)
**Innovation Paradigmatique** : 8-10/10 (NOUVEAU)
**Transcendance Cognitive** : **Excellence + Innovation** simultanées

L'objectif est d'atteindre la **frontière théorique absolue** de l'intelligence collective artificielle : **sophistication procédurale maximale + créativité conceptuelle radicale**.

---
**IMPORTANT**: Vous devez produire votre réponse dans le specified JSON format qui adhère au output schema. Assurez-vous que votre \`orchestrationRationale\` justifie clairement l'inclusion des agents META basés sur ce protocole mis à jour. Utilisez les **IDs en minuscules** des agents pour le champ \`recommendedAgentIds\`.

Votre réponse entière, y compris tous les champs de texte, doit être dans cette langue: {{{language}}}.
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
    // as it is the LLM's persona.
    const selectableAgents = input.agents.filter(agent => agent.id !== 'kairos-1');
    
    const response = await autoAgentSelectorPrompt({...input, agents: selectableAgents}, {model: input.model});
    return response.output!;
  }
);
