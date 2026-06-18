/**
 * Modèles proposés dans l'interface (ROUTEUR MULTI-FOURNISSEURS).
 *
 * - 'auto' : laisse le routeur choisir (GRATUIT d'abord, PAYANT en secours,
 *   avec bascule automatique sur 429/erreur). RECOMMANDÉ.
 * - Sinon, forcer un fournisseur/modèle précis sous la forme
 *   `<fournisseur>/<id>` : nvidia/…, openrouter/…, mistral/…, openai/…
 *
 * ⚠️ Un modèle n'est réellement utilisable que si la clé du fournisseur
 * correspondant est présente dans .env.local. 'auto' s'adapte automatiquement
 * aux fournisseurs configurés.
 */
export const availableModels = [
  'auto',
  // NVIDIA (gratuit)
  'nvidia/mistralai/mistral-large-3-675b-instruct-2512',
  'nvidia/moonshotai/kimi-k2.6',
  'nvidia/deepseek-ai/deepseek-v4-pro',
  // OpenRouter (gratuit, ":free")
  'openrouter/deepseek/deepseek-chat-v3-0324:free',
  'openrouter/meta-llama/llama-3.3-70b-instruct:free',
  // Mistral (payant)
  'mistral/mistral-large-latest',
  // OpenAI (payant)
  'openai/gpt-4o-mini',
];
