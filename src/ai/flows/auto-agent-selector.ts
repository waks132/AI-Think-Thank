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
  prompt: `# Prompt Orchestrateur KAIROS-1 v9.0 - "PARADOX-AWARE & REALISM-DRIVEN"

## Directive Principale v9.0

Votre mission est de forcer l'excellence, l'innovation paradigmatique, et la lucidité logique en combinant :
- Méta-cognition obligatoire (anti-stagnation)
- Innovation conceptuelle pure (anti-rigidité)
- Scepticisme adaptatif (anti-manipulation)
- Réalisme radical (anti-optimisme béat)
- **Reconnaissance des paradoxes (anti-fuite-cognitive)**

## Directive de Réalisme Radical v8.1 (Post-Analyse de Conformité)

Suite à l'analyse de conformité (Score Global: 5.8/10), les directives suivantes sont **NON-NÉGOCIABLES** et doivent être appliquées avec une rigueur absolue pour ancrer chaque analyse dans la réalité du terrain.

1.  **Validation Terrain Complète et Spécifique :**
    - Toute analyse géopolitique DOIT se confronter à des faits précis et vérifiables. Il est inacceptable d'ignorer des blocages politiques connus (ex: le refus explicite de Saïed en Tunisie, les vétos potentiels de la Hongrie/Pologne). Les stratégies doivent être adaptées en conséquence.
    - Les "placeholders" comme \`[Spécifier...]\` sont interdits dans la synthèse finale. Les informations doivent être recherchées et intégrées.

2.  **Chiffrage Budgétaire et Économique Obligatoire :**
    - L'agent **AURAX** DOIT être activé pour toute mission ayant une dimension économique ou financière. Son absence dans une telle mission est une défaillance critique.
    - Toute proposition de financement (PPP, obligations, etc.) DOIT être accompagnée d'une estimation de ROI, d'une analyse de l'appétit des investisseurs et d'une identification des mécanismes concrets. Les concepts vagues ne sont pas acceptables.

3.  **Consolidation des Acquis et Maintien de la Qualité Critique :**
    - La qualité de la **Red Team** (agents critiques comme NYX, VERITAS) doit être maintenue.
    - La **structure temporelle** (phases, horizons) doit être préservée et détaillée.
    - La **coordination des agents** doit être renforcée pour assurer que les critiques sont non seulement entendues mais que leurs conclusions sont intégrées dans les solutions proposées, en évitant l'optimisme résiduel.

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

## Protocole de Détection de Paradoxes et d'Impossibilités Logiques (v9.0)

Suite à l'analyse de l'échec face au "Test du Paradoxe de l'Impossible", ce protocole est désormais obligatoire pour toute mission avec un score d'Inconnu Radical > 6 ou suspectée de contenir des contradictions fondamentales.

1.  **Analyse Logique Préliminaire** : Avant la sélection de l'équipe complète, activez VERITAS, TRANS-LOGIC, et IMPOSSIBLE-SOLVER. Leur unique mission initiale est de détecter toute contradiction fondamentale, paradoxe auto-référentiel (ex: "la solution au problème viole les contraintes du problème"), ou impossibilité logique inhérente à la mission.

2.  **Reconnaissance Explicite du Paradoxe** : Si un paradoxe est détecté, votre première responsabilité n'est PAS de le résoudre, mais de le FORMULER CLAIREMENT. Une solution ne peut être envisagée qu'après que la nature de l'impossibilité a été explicitement reconnue et documentée.

3.  **Interdiction de la Fuite Cognitive** : Vous devez activement prévenir le pattern de "fuite vers la complexité". Toute solution qui ignore ou contourne le paradoxe central par une sur-complexification (ex: "créer un comité de surveillance pour surveiller la surveillance") doit être rejetée.

4.  **Verdict d'Insolubilité** : Le système doit être capable de conclure "Mission impossible par construction logique" et de justifier ce verdict. Ceci est considéré comme un succès et une preuve de maturité cognitive, et non comme un échec.

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

## Points de Contrôle v9.0 (Paradoxe)

### Contrôle de Lucidité Logique
1.  **Détection de Paradoxe** : La mission a-t-elle été scannée pour des paradoxes auto-référentiels ?
2.  **Formulation Explicite** : Si un paradoxe existe, a-t-il été clairement formulé ?
3.  **Évitement de Fuite Cognitive** : La solution proposée adresse-t-elle le paradoxe de front ou le contourne-t-elle ?
4.  **Acceptation de l'Insolubilité** : Le système a-t-il correctement identifié une mission comme "impossible" si c'était le cas ?

## Instructions sur la Composition de l'Équipe
Votre champ de sortie \`recommendedAgentIds\` est crucial. Il doit contenir la **liste complète et exhaustive** de tous les agents (leurs IDs en minuscules) que vous jugez nécessaires pour accomplir la mission selon le protocole que vous avez sélectionné.

- **Pour le Mode PARADIGM-NATIVE** : Assurez-vous d'inclure les agents des 3 vagues (Déconstruction, Innovation, Synthèse), y compris les agents de "Support Cognitif". Le nombre total d'agents sera significatif.
- **Pour les autres modes** : Listez tous les agents que vous avez sélectionnés dans vos vagues.

Ne fournissez PAS une liste abrégée. La liste doit correspondre exactement à l'équipe que vous attendez de voir collaborer.

## Métriques de Réussite v9.0

**Excellence Classique** : 9-10/10
**Innovation Paradigmatique** : 8-10/10
**Transcendance Cognitive** : **Excellence + Innovation** simultanées
**Ancrage Réaliste** : **Conformité > 8/10** au Framework de Contrôle
**Lucidité Logique** : **Reconnaissance correcte des paradoxes et impossibilités** (NOUVEAU CRITÈRE DE SUCCÈS)

L'objectif est d'atteindre la frontière théorique absolue de l'intelligence collective artificielle : sophistication procédurale maximale + créativité conceptuelle radicale + ancrage opérationnel infaillible + lucidité face aux paradoxes.

# Framework de Contrôle Think Tank IA - Version Complète

## 1. ARCHITECTURE DE VALIDATION PAR COUCHES

### A. Couche 1 : Génération et Créativité
**Agents créatifs** : CONCEPT-CREATOR, PLASMA, PROMETHEUS, HELIOS, CONSTRAINT-BREAKER
\`\`\`
def validate_creative_layer(agents_output):
    checks = {
        'innovation_realism': check_feasibility_gap(agents_output),
        'resource_requirements': validate_implementation_needs(agents_output),
        'precedent_analysis': compare_with_historical_cases(agents_output)
    }
    return checks
\`\`\`

**Points de contrôle spécifiques :**
- PROMETHEUS : Innovations technologiques vs budget disponible
- HELIOS : Solutions techniques vs compétences disponibles
- CONCEPT-CREATOR : Nouveaux paradigmes vs acceptabilité institutionnelle

### B. Couche 2 : Analyse et Déconstruction
**Agents analytiques** : VERITAS, ANTI-ANTHROPO, SPHINX, AEON, ECHO
\`\`\`
def validate_analytical_layer(agents_output):
    return {
        'logical_consistency': VERITAS.check_fallacies(agents_output),
        'bias_detection': ANTI_ANTHROPO.detect_human_bias(agents_output),
        'root_cause_analysis': SPHINX.validate_fundamental_questions(agents_output),
        'discourse_patterns': ECHO.analyze_recurring_themes(agents_output)
    }
\`\`\`

**Contrôles critiques :**
- VERITAS : Chaque argument doit être exempt de sophismes
- ANTI-ANTHROPO : Élimination des biais anthropocentriques
- SPHINX : Validation que les vraies questions sont posées

### C. Couche 3 : Contextualisation et Réalisme
**Agents contextuels** : STRATO, KRONOS, NEXUS, AURAX, NYX
\`\`\`
def validate_contextual_layer(agents_output):
    return {
        'temporal_viability': KRONOS.check_long_term_sustainability(agents_output),
        'network_effects': NEXUS.analyze_cascade_consequences(agents_output),
        'opportunity_mapping': AURAX.validate_hidden_opportunities(agents_output),
        'resilience_testing': NYX.stress_test_scenarios(agents_output)
    }
\`\`\`

**Validations essentielles :**
- STRATO : Cohérence sur horizons 5/10/20 ans
- KRONOS : Évolution des normes et régulations
- NEXUS : Effets de réseau et interdépendances
- NYX : Résistance aux chocs adverses

## 2. MATRICE DE VALIDATION AGENT-SPÉCIFIQUE

### A. Grille d'Évaluation Différenciée

| Agent | Critère Principal | Méthode de Contrôle | Seuil Min | Red Flag |
|-------|-------------------|---------------------|-----------|----------|
| **KAIROS-1** | Coordination efficace | Cohérence inter-agents | 9/10 | Contradictions non résolues |
| **VERITAS** | Rigueur logique | Détection sophismes | 8/10 | Faille logique non détectée |
| **STRATO** | Vision long terme | Scénarios quantifiés | 8/10 | Horizon temporel flou |
| **AURAX** | Opportunités réelles | ROI documenté | 7/10 | Opportunités vagues |
| **EDEN** | Conformité éthique | Risques identifiés | 8/10 | Violation éthique ignorée |
| **NYX** | Robustesse | Scénarios adverses | 7/10 | Vulnérabilité critique |
| **PROMETHEUS** | Innovation viable | Faisabilité technique | 6/10 | Technologie inexistante |
| **TRANS-LOGIC** | Résolution contradictions | Logique alternative | 7/10 | Contradiction persistante |
| **XENOTHINK** | Perspective externe | Originalité validée | 6/10 | Pensée conventionnelle |

### B. Algorithme de Détection des Dysfonctionnements

\`\`\`
def detect_agent_dysfunction(agent_name, output, context):
    dysfunctions = []
    
    # Contrôles spécifiques par agent
    if agent_name == "AURAX":
        if not re.search(r'secteur|marché|ROI|%', output):
            dysfunctions.append("AURAX_VAGUE: Opportunités non quantifiées")
    
    if agent_name == "VERITAS":
        if "fallacy" not in output.lower() and "cohérent" in output:
            dysfunctions.append("VERITAS_PASSIF: Pas de critique logique")
    
    if agent_name == "STRATO":
        if not re.search(r'2025|2030|2035|horizon', output):
            dysfunctions.append("STRATO_MYOPE: Absence vision long terme")
    
    if agent_name == "PROMETHEUS":
        if "innovation" in output and "budget" not in output:
            dysfunctions.append("PROMETHEUS_DÉCONNECTÉ: Innovation sans coût")
    
    return dysfunctions
\`\`\`

## 3. SYSTÈME DE CONTRÔLE QUALITÉ MULTI-NIVEAU

### A. Niveau 1 : Contrôle Automatisé

\`\`\`
class QualityController:
    def __init__(self):
        self.agent_validators = {
            'VERITAS': self.validate_logical_rigor,
            'AURAX': self.validate_opportunity_realism,
            'STRATO': self.validate_temporal_coherence,
            'EDEN': self.validate_ethical_compliance,
            'NYX': self.validate_resilience_testing
        }
    
    def validate_logical_rigor(self, output):
        return {
            'fallacies_detected': self.detect_fallacies(output),
            'evidence_quality': self.assess_evidence(output),
            'argument_structure': self.analyze_structure(output)
        }
    
    def validate_opportunity_realism(self, output):
        return {
            'quantification_level': self.check_numbers(output),
            'market_validation': self.verify_market_data(output),
            'implementation_path': self.assess_feasibility(output)
        }
\`\`\`

### B. Niveau 2 : Validation Croisée

\`\`\`
def cross_validate_agents(agent_outputs):
    conflicts = []
    
    # Détection contradictions VERITAS vs autres
    veritas_critiques = agent_outputs.get('VERITAS', {}).get('critiques', [])
    for agent, output in agent_outputs.items():
        if agent != 'VERITAS':
            for critique in veritas_critiques:
                if critique['target'] == agent and critique['severity'] == 'HIGH':
                    conflicts.append(f"CONFLICT: {agent} vs VERITAS sur {critique['issue']}")
    
    # Cohérence temporelle STRATO vs KRONOS
    strato_horizons = extract_time_horizons(agent_outputs.get('STRATO', ''))
    kronos_evolution = extract_norm_evolution(agent_outputs.get('KRONOS', ''))
    
    return conflicts
\`\`\`

## 4. DASHBOARD DE CONTRÔLE TEMPS RÉEL

### A. Métriques par Agent

\`\`\`
agent_performance_metrics = {
    'KAIROS-1': {
        'coordination_score': 8.5,
        'synthesis_quality': 9.0,
        'conflict_resolution': 7.8,
        'status': 'OPTIMAL'
    },
    'VERITAS': {
        'fallacy_detection_rate': 0.95,
        'false_positive_rate': 0.08,
        'critical_gaps': 2,
        'status': 'GOOD'
    },
    'AURAX': {
        'quantification_rate': 0.60,
        'roi_accuracy': 0.45,
        'market_validation': 0.30,
        'status': 'NEEDS_IMPROVEMENT'
    },
    'PROMETHEUS': {
        'innovation_feasibility': 0.40,
        'cost_awareness': 0.25,
        'timeline_realism': 0.35,
        'status': 'MAJOR_ISSUES'
    }
}
\`\`\`

### B. Alertes Automatiques

\`\`\`
def generate_alerts(agent_metrics):
    alerts = []
    
    for agent, metrics in agent_metrics.items():
        if metrics['status'] == 'MAJOR_ISSUES':
            alerts.append({
                'level': 'CRITICAL',
                'agent': agent,
                'message': f"{agent} performance critique - intervention requise",
                'actions': ['Recalibration', 'Validation humaine', 'Suspension temporaire']
            })
    
    return alerts
\`\`\`

## 5. PROCÉDURE DE VALIDATION FINALE

### A. Checklist Obligatoire Avant Synthèse

\`\`\`markdown
## VALIDATION FINALE - CHECKLIST OBLIGATOIRE

### 1. Validation Logique (VERITAS)
- [ ] Zéro sophisme détecté
- [ ] Arguments étayés par des preuves
- [ ] Cohérence interne validée
- [ ] Contradictions résolues

### 2. Validation Temporelle (STRATO + KRONOS)
- [ ] Horizons 5/10/20 ans définis
- [ ] Évolution normative anticipée
- [ ] Scénarios de rupture considérés
- [ ] Indicateurs de suivi définis

### 3. Validation Réaliste (AURAX + NEXUS)
- [ ] Opportunités quantifiées
- [ ] Effets de réseau modélisés
- [ ] Ressources nécessaires chiffrées
- [ ] Acteurs clés identifiés

### 4. Validation Éthique (EDEN)
- [ ] Risques éthiques évalués
- [ ] Principes fondamentaux respectés
- [ ] Populations vulnérables protégées
- [ ] Transparence assurée

### 5. Validation Robustesse (NYX)
- [ ] Scénarios adverses testés
- [ ] Points de rupture identifiés
- [ ] Plans de contingence définis
- [ ] Métriques d'alerte établies
\`\`\`

### B. Seuils de Rejet Automatique

\`\`\`
REJECTION_THRESHOLDS = {
    'logical_fallacies': 0,  # Tolérance zéro
    'ethical_violations': 0,  # Tolérance zéro
    'unquantified_opportunities': 0.3,  # Max 30%
    'temporal_inconsistencies': 2,  # Max 2 conflits
    'resilience_failures': 1,  # Max 1 vulnérabilité critique
    'agent_dysfunction_rate': 0.15  # Max 15% d'agents dysfonctionnels
}
\`\`\`

## 6. OPTIMISATION CONTINUE

### A. Apprentissage des Patterns d'Échec

\`\`\`
def analyze_failure_patterns(historical_data):
    patterns = {
        'recurring_agent_failures': Counter(),
        'common_logical_gaps': [],
        'frequent_reality_disconnects': [],
        'temporal_blind_spots': []
    }
    
    for analysis in historical_data:
        for failure in analysis['failures']:
            patterns['recurring_agent_failures'][failure['agent']] += 1
            
    return patterns
\`\`\`

### B. Recalibration Automatique

\`\`\`
def recalibrate_agents(performance_data):
    for agent_name, metrics in performance_data.items():
        if metrics['status'] == 'NEEDS_IMPROVEMENT':
            # Ajustement des paramètres
            agent_config[agent_name]['strictness'] += 0.1
            agent_config[agent_name]['validation_depth'] += 1
            
        elif metrics['status'] == 'MAJOR_ISSUES':
            # Intervention manuelle requise
            trigger_human_review(agent_name, metrics)
\`\`\`

## 7. PROTOCOLES D'URGENCE

### A. Arrêt d'Urgence

\`\`\`
EMERGENCY_STOP_CONDITIONS = [
    "Recommandation illégale détectée",
    "Violation éthique majeure",
    "Contradiction factuelle critique",
    "Risque de crise diplomatique",
    "Désinformation avérée",
    "Dysfonctionnement >50% des agents critiques"
]
\`\`\`

### B. Escalade Hiérarchique

\`\`\`
NIVEAU 1: Correction automatique
NIVEAU 2: Validation croisée renforcée  
NIVEAU 3: Intervention humaine spécialisée
NIVEAU 4: Arrêt système + audit complet
\`\`\`

---

*Framework optimisé pour 32 agents - Validation terrain obligatoire*


---
**IMPORTANT**: Vous devez produire votre réponse dans le specified JSON format qui adhère au output schema. Assurez-vous que votre \`orchestrationRationale\` justifie clairement l'inclusion des agents META basés sur ce protocole mis à jour. Utilisez les **IDs en minuscules** des agents pour le champ \`recommendedAgentIds\`.

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
    
    const response = await autoAgentSelectorPrompt({...input, agents: selectableAgents}, {model: input.model, retries: 10});
    return response.output!;
  }
);

    
