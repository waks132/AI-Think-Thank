/**
 * ROUTEUR MULTI-FOURNISSEURS — bascule intelligente.
 *
 * Politique : GRATUIT d'abord (NVIDIA, OpenRouter :free), PAYANT en secours
 * (Mistral, OpenAI). Sur échec d'un fournisseur (429, JSON invalide, outil
 * introuvable, timeout…), on bascule automatiquement sur le suivant.
 *
 * Pour OpenRouter, les modèles gratuits sont découverts dynamiquement via son
 * API /models (filtrés sur pricing = 0 / suffixe ":free"), avec mise en cache.
 */
import { enabledProviders } from '@/ai/genkit';
import { withLLMRetry } from '@/ai/resilience';

interface OpenRouterFree {
  models: string[];     // tous les modèles gratuits
  toolModels: string[]; // gratuits supportant le function calling
}

let orCache: { data: OpenRouterFree; ts: number } | null = null;
const CACHE_MS = 30 * 60 * 1000; // 30 min

// Repli si l'API OpenRouter est indisponible (identifiants connus de modèles :free).
const OR_FALLBACK: OpenRouterFree = {
  models: [
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
  ],
  toolModels: [
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
  ],
};

async function discoverOpenRouterFree(): Promise<OpenRouterFree> {
  if (orCache && Date.now() - orCache.ts < CACHE_MS) return orCache.data;
  try {
    const key = process.env.OPENROUTER_API_KEY ?? '';
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: any = await res.json();
    const all: any[] = json?.data ?? [];
    const free = all.filter((m) => {
      const p = m?.pricing ?? {};
      const isFreeId = typeof m?.id === 'string' && m.id.endsWith(':free');
      const isZeroPrice = Number(p?.prompt) === 0 && Number(p?.completion) === 0;
      return isFreeId || isZeroPrice;
    });
    const models = free.map((m) => m.id).filter(Boolean);
    const toolModels = free
      .filter((m) => Array.isArray(m?.supported_parameters) && m.supported_parameters.includes('tools'))
      .map((m) => m.id)
      .filter(Boolean);
    const data: OpenRouterFree = {
      models: models.length ? models : OR_FALLBACK.models,
      toolModels: toolModels.length ? toolModels : OR_FALLBACK.toolModels,
    };
    orCache = { data, ts: Date.now() };
    console.log(`[routeur] OpenRouter : ${data.models.length} modèles gratuits (${data.toolModels.length} avec outils).`);
    return data;
  } catch (e) {
    console.warn('[routeur] Découverte OpenRouter indisponible, repli sur la liste connue.');
    return OR_FALLBACK;
  }
}

/**
 * Construit la chaîne ordonnée de modèles à essayer (gratuit -> payant).
 * - `requireTools` : ne garde que des modèles capables de function calling.
 * - `preferredModel` : placé en tête (ex. choix UI), 'auto'/vide = ignoré.
 */
export async function getModelChain(
  opts: { requireTools?: boolean; preferredModel?: string } = {}
): Promise<string[]> {
  const chain: string[] = [];
  for (const p of enabledProviders) {
    if (p.name === 'openrouter') {
      const { models, toolModels } = await discoverOpenRouterFree();
      const pick = (opts.requireTools ? toolModels : models).slice(0, 2);
      for (const id of pick) chain.push(`openrouter/${id}`);
    } else {
      chain.push(`${p.name}/${p.defaultModel}`);
    }
  }
  let ordered = chain;
  const pref = opts.preferredModel;
  if (pref && pref !== 'auto') {
    ordered = [pref, ...chain.filter((m) => m !== pref)];
  }
  return Array.from(new Set(ordered));
}

/**
 * Exécute `call(modelRef)` en essayant chaque fournisseur de la chaîne, avec
 * retry par modèle ; bascule sur le suivant en cas d'échec. Renvoie le 1er
 * succès, ou propage la dernière erreur si tous échouent.
 */
export async function withModelFallback<T>(
  call: (modelRef: string) => Promise<T>,
  opts: { requireTools?: boolean; preferredModel?: string; label?: string } = {}
): Promise<T> {
  const chain = await getModelChain(opts);
  if (chain.length === 0) {
    throw new Error('Aucun fournisseur LLM configuré (renseignez une clé dans .env.local).');
  }
  // Tentatives par modèle ADAPTATIVES : si peu de fournisseurs, on insiste
  // davantage sur chacun (sinon un seul fournisseur n'aurait pas assez d'essais
  // pour absorber les hoquets JSON/429). Beaucoup de fournisseurs -> on bascule vite.
  const perModelAttempts = chain.length <= 1 ? 4 : chain.length === 2 ? 3 : 2;
  let lastErr: unknown;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      return await withLLMRetry(() => call(model), {
        label: `${opts.label ?? 'LLM'}@${model}`,
        maxAttempts: perModelAttempts,
      });
    } catch (e) {
      lastErr = e;
      const more = i < chain.length - 1;
      console.warn(
        `[routeur] ${model} a échoué${more ? ` -> bascule (${i + 2}/${chain.length})` : ' (dernier fournisseur)'}.`
      );
    }
  }
  throw lastErr;
}
