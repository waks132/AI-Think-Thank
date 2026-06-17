/**
 * Modèles NVIDIA NIM (endpoints gratuits) proposés dans l'interface.
 *
 * Le préfixe "nvidia/" correspond au nom du plugin openAICompatible défini
 * dans src/ai/genkit.ts. Le reste est l'identifiant exact du modèle tel que
 * listé sur https://build.nvidia.com/models (filtre "Free Endpoint").
 *
 * ⚠️ IMPORTANT : cette application utilise des sorties structurées (JSON/Zod)
 * et du function calling. Privilégiez des modèles qui supportent
 * `tool_calling` ET `structured output` (ex. famille Llama 3.3 / Nemotron /
 * Qwen2.5 / Mistral Large). Ajustez cette liste selon votre config NVIDIA.
 */
export const availableModels = [
  'nvidia/meta/llama-3.3-70b-instruct',
  'nvidia/nvidia/llama-3.1-nemotron-70b-instruct',
  'nvidia/meta/llama-3.1-405b-instruct',
  'nvidia/qwen/qwen2.5-coder-32b-instruct',
  'nvidia/mistralai/mistral-large-2-instruct',
];
