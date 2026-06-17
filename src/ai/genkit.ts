import {genkit} from 'genkit';
import {openAICompatible} from '@genkit-ai/compat-oai';

/**
 * VERSION LOCALE — NVIDIA NIM (endpoints gratuits)
 * ------------------------------------------------
 * Cette application n'utilise plus Google Gemini. Toutes les générations
 * passent par l'API NVIDIA NIM, qui est compatible avec le protocole OpenAI.
 *
 * Configuration via .env.local (voir .env.local.example) :
 *   - NVIDIA_API_KEY        : votre clé "nvapi-..." obtenue sur https://build.nvidia.com
 *   - NVIDIA_BASE_URL       : endpoint OpenAI-compatible NVIDIA
 *   - NVIDIA_DEFAULT_MODEL  : modèle par défaut (doit supporter tools + JSON/structured output)
 *
 * Le nom du plugin est "nvidia", donc les modèles se référencent sous la forme
 *   nvidia/<id-du-modele>      ex. nvidia/mistralai/mistral-large-3-675b-instruct-2512
 */

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? '';
const NVIDIA_DEFAULT_MODEL =
  process.env.NVIDIA_DEFAULT_MODEL ?? 'mistralai/mistral-large-3-675b-instruct-2512';

if (!NVIDIA_API_KEY) {
  console.warn(
    '[genkit] NVIDIA_API_KEY est manquant. Renseignez-le dans .env.local — ' +
      'aucune génération ne fonctionnera tant que la clé n\'est pas définie.'
  );
}

const plugins = [
  openAICompatible({
    name: 'nvidia',
    apiKey: NVIDIA_API_KEY,
    baseURL: NVIDIA_BASE_URL,
  }),
];

export const ai = genkit({
  plugins,
  // Modèle par défaut pour toute l'application.
  // Surchargeable dans chaque appel generate / prompt via l'option `model`.
  model: `nvidia/${NVIDIA_DEFAULT_MODEL}`,
});

/**
 * Directive de format de sortie — AJUSTEMENT NVIDIA.
 *
 * Contrairement à Gemini, les modèles NVIDIA NIM (Mistral, DeepSeek, etc.)
 * ont tendance, lorsqu'on combine `tools` (function calling) ET sortie
 * structurée Zod, à entourer leur JSON de blocs markdown (```json) ou à
 * ajouter de la prose, ce qui fait échouer le parsing de Genkit
 * (« JSON5: invalid character »). Ajouter cette directive à la fin des
 * prompts concernés force une sortie JSON brute et parsable.
 *
 * Empiriquement validé : sans cette directive mistral-large-3 échoue le
 * parsing ; avec, il renvoie un JSON propre.
 */
export const JSON_OUTPUT_DIRECTIVE =
  "\n\nFORMAT DE SORTIE STRICT : Répondez UNIQUEMENT avec un seul objet JSON brut " +
  "conforme au schéma de sortie. N'utilisez PAS de blocs de code markdown " +
  "(pas de ```), n'ajoutez AUCUN texte, commentaire ou prose avant ou après le JSON.";

/**
 * Paramètres de génération PAR MODÈLE — AJUSTEMENT NVIDIA.
 *
 * ⚠️ Deux pièges du plugin @genkit-ai/compat-oai vérifiés empiriquement :
 *  1. `maxOutputTokens` est IGNORÉ par le plugin (destructuré mais jamais
 *     mappé vers max_tokens). Il faut donc passer `max_tokens` BRUT.
 *  2. Toute clé de config inconnue est transmise telle quelle dans le corps de
 *     la requête (`...restOfConfig`). On peut donc passer des paramètres
 *     spécifiques NVIDIA comme `chat_template_kwargs` (ex. thinking deepseek).
 *
 * Les clés sont les IDs de modèle SANS le préfixe "nvidia/".
 */
export type GenConfig = Record<string, unknown>;

const DEFAULT_GEN_CONFIG: GenConfig = {
  temperature: 0.3,
  top_p: 1,
  max_tokens: 4096,
};

const MODEL_GEN_CONFIG: Record<string, GenConfig> = {
  // Défaut : rapide et déterministe, idéal pour la sortie structurée JSON.
  'mistralai/mistral-large-3-675b-instruct-2512': {
    temperature: 0.15,
    top_p: 1,
    max_tokens: 4096,
  },
  // Robuste sur le combo tools+schéma, mais lent : on lui laisse de la marge.
  'moonshotai/kimi-k2.6': {
    temperature: 0.6,
    top_p: 1,
    max_tokens: 8192,
  },
  // Modèle à raisonnement. `thinking:true` = raisonnement profond (meilleure
  // qualité) mais plus lent (peut atteindre les timeouts sur tools+schéma).
  // Repasser à `false` pour privilégier la vitesse au détriment de la qualité.
  'deepseek-ai/deepseek-v4-pro': {
    temperature: 0.6,
    top_p: 0.95,
    max_tokens: 8192,
    chat_template_kwargs: { thinking: true },
  },
  // JSON fiable ; tools instables via Genkit -> à réserver aux flows sans tools.
  'openai/gpt-oss-120b': {
    temperature: 0.4,
    top_p: 1,
    max_tokens: 8192,
  },
};

/**
 * Profils de génération PAR TYPE DE FLOW.
 *
 * La température et le nombre de tokens dépendent davantage de la NATURE de la
 * tâche que du modèle : une sélection d'agents doit être déterministe, une
 * génération créative doit diverger. Le profil est appliqué APRÈS la config
 * modèle et surcharge `temperature` + `max_tokens` (le modèle garde son `top_p`
 * et ses options spéciales comme `chat_template_kwargs`).
 */
export type FlowProfile =
  | 'precise'     // sélection/classification : déterministe, gros schéma
  | 'analytical'  // synthèse fondée, rapports, analyse causale
  | 'reasoning'   // raisonnement structuré, critique stratégique
  | 'creative'    // contributions d'agents, clash cognitif, réécriture
  | 'metrics';    // scoring / métriques : déterministe et court

const PROFILE_OVERRIDES: Record<FlowProfile, GenConfig> = {
  precise:    { temperature: 0.1,  max_tokens: 8192 },
  analytical: { temperature: 0.3,  max_tokens: 8192 },
  reasoning:  { temperature: 0.45, max_tokens: 6144 },
  creative:   { temperature: 0.85, max_tokens: 4096 },
  metrics:    { temperature: 0.1,  max_tokens: 2048 },
};

/**
 * Retourne les paramètres de génération pour un modèle + un type de flow.
 * Fusion : valeurs globales < config modèle < profil de flow.
 * `model` peut inclure ou non le préfixe "nvidia/"; `undefined` => défaut.
 * `profile` optionnel ; absent => config modèle seule.
 */
export function getModelConfig(model?: string, profile?: FlowProfile): GenConfig {
  const id = (model ?? NVIDIA_DEFAULT_MODEL).replace(/^nvidia\//, '');
  const base = { ...DEFAULT_GEN_CONFIG, ...(MODEL_GEN_CONFIG[id] ?? {}) };
  return profile ? { ...base, ...PROFILE_OVERRIDES[profile] } : base;
}
