/**
 * Modèles NVIDIA NIM (endpoints gratuits) proposés dans l'interface.
 *
 * Le préfixe "nvidia/" correspond au nom du plugin openAICompatible défini
 * dans src/ai/genkit.ts. Le reste est l'identifiant exact du modèle.
 *
 * ⚠️ Liste établie EMPIRIQUEMENT (voir LOCAL_SETUP.md § « Résultats des tests »).
 * L'app exige sortie structurée JSON (12 flows) ET function calling (4 flows).
 * Ne sont retenus que les modèles qui passent ces tests via Genkit.
 *
 * Classement (du plus adapté au moins adapté) :
 *  1. mistral-large-3  : JSON + tools OK, très rapide. ⚠️ tier gratuit très
 *                        limité en débit (429 fréquents en rafale).
 *  2. kimi-k2.6        : seul modèle 100% fiable sur le combo tools+schéma,
 *                        mais plus lent (~60s sur les missions à tools).
 *  3. deepseek-v4-pro  : JSON rapide ; tools+schéma fonctionnel mais lent.
 *  4. gpt-oss-120b     : JSON OK ; function calling instable via Genkit.
 *
 * Volontairement EXCLUS (échecs aux tests) :
 *  - nvidia/llama-3.3-nemotron-super-49b : renvoie un content VIDE en mode JSON.
 *  - meta/llama-4-maverick               : ne déclenche PAS le function calling.
 *  - z-ai/glm-5.1, qwen/qwen3.5-122b     : timeouts (>90s) en non-stream.
 *  - mistralai/mistral-medium-3.5        : trop lent (15-66s) + schéma strict non respecté.
 */
export const availableModels = [
  'nvidia/mistralai/mistral-large-3-675b-instruct-2512',
  'nvidia/moonshotai/kimi-k2.6',
  'nvidia/deepseek-ai/deepseek-v4-pro',
  'nvidia/openai/gpt-oss-120b',
];
