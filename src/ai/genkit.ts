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
 *   nvidia/<id-du-modele>      ex. nvidia/meta/llama-3.3-70b-instruct
 */

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? '';
const NVIDIA_DEFAULT_MODEL =
  process.env.NVIDIA_DEFAULT_MODEL ?? 'meta/llama-3.3-70b-instruct';

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
