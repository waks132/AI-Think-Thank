/**
 * Couche de résilience pour les appels LLM — AJUSTEMENT NVIDIA.
 *
 * Les endpoints gratuits NVIDIA NIM présentent deux fragilités constatées
 * empiriquement (voir LOCAL_SETUP.md § « Résultats des tests ») :
 *
 *  1. Rate limits agressifs : erreurs 429 / RESOURCE_EXHAUSTED fréquentes,
 *     surtout en rafale (fan-out multi-agents).
 *  2. Sortie structurée instable sur le combo tools + schéma Zod : le modèle
 *     omet parfois un champ requis ou entoure son JSON de prose/fences, d'où
 *     des erreurs « Schema validation failed » ou « JSON5: invalid character ».
 *
 * `withLLMRetry` ré-essaie automatiquement ces cas avec un backoff exponentiel,
 * ce qui rend les flows utilisables malgré la variance des modèles gratuits.
 */

export interface LLMRetryOptions {
  /** Nombre maximum de tentatives (défaut 3). */
  maxAttempts?: number;
  /** Délai de base en ms, doublé à chaque tentative (défaut 1500). */
  baseDelayMs?: number;
  /** Étiquette pour les logs. */
  label?: string;
}

/** Détermine si une erreur justifie un nouvel essai. */
function isRetriable(message: string): boolean {
  return /(429|RESOURCE_EXHAUSTED|rate.?limit|Schema validation|JSON5|invalid character|Parse Error|INVALID_ARGUMENT|timeout|ECONNRESET|503|502)/i.test(
    message
  );
}

/**
 * Exécute `fn` avec retry + backoff exponentiel sur les erreurs transitoires
 * (rate limit) et de format (sortie structurée incomplète).
 */
export async function withLLMRetry<T>(
  fn: () => Promise<T>,
  opts: LLMRetryOptions = {}
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelay = opts.baseDelayMs ?? 1500;
  const label = opts.label ?? 'LLM';

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);

      if (!isRetriable(message) || attempt === maxAttempts) {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `[${label}] tentative ${attempt}/${maxAttempts} échouée : ` +
          `${message.slice(0, 100)} — nouvel essai dans ${delay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
