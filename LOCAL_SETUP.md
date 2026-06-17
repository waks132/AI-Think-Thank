# AI-Think-Thank — Installation locale (NVIDIA NIM)

Version locale du think-tank multi-agents, fonctionnant **exclusivement avec les
endpoints gratuits de NVIDIA NIM** (compatibles OpenAI) et un **émulateur
Firebase local**. Aucune dépendance à Google Gemini ni à un Firestore cloud.

---

## 1. Prérequis

- **Node.js 20+** (le projet cible `nodejs_20`)
- **Java JDK 11+** (requis par les émulateurs Firebase)
- **Firebase CLI** : `npm install -g firebase-tools`
- Une **clé API NVIDIA** : créez un compte sur <https://build.nvidia.com>
  (1000 crédits offerts), puis générez une clé `nvapi-...`.

## 2. Récupérer le code

```bash
git clone <url-du-repo> ai-think-thank
cd ai-think-thank
git checkout claude/intelligent-cerf-5liqiq
npm install
```

## 3. Configurer l'environnement

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` et renseignez **au minimum** :

```dotenv
NVIDIA_API_KEY=nvapi-VOTRE_CLE
NVIDIA_DEFAULT_MODEL=meta/llama-3.3-70b-instruct
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

> Choisissez un modèle qui supporte **tool_calling ET structured output (JSON)**.
> Vérifiez la disponibilité « Free Endpoint » sur
> <https://build.nvidia.com/models>. Modèles recommandés au départ :
> `meta/llama-3.3-70b-instruct`, `nvidia/llama-3.1-nemotron-70b-instruct`.

## 4. Lancer en local (2 terminaux)

**Terminal A — émulateurs Firebase :**

```bash
npm run firebase:emulators
# UI des émulateurs : http://127.0.0.1:4000   |   Firestore : 127.0.0.1:8080
```

**Terminal B — application Next.js :**

```bash
npm run dev
# Application : http://localhost:9002
```

## 5. Vérifier que tout fonctionne

1. Ouvrez <http://localhost:9002>.
2. Lancez un outil simple (ex. « Agent Reasoning ») avec une tâche courte.
3. Surveillez le terminal B : un appel sortant doit partir vers
   `integrate.api.nvidia.com`. Les lectures/écritures Firestore apparaissent
   dans l'UI des émulateurs (port 4000).

---

## Ce qui a été modifié par rapport à la version d'origine

| Fichier | Changement |
|---|---|
| `src/ai/genkit.ts` | Plugin `@genkit-ai/googleai` → `@genkit-ai/compat-oai` (`openAICompatible`) pointant sur NVIDIA, tout piloté par `.env.local`. |
| `src/lib/models.ts` | Liste de modèles NVIDIA (préfixe `nvidia/`) au lieu de Gemini. |
| `src/lib/fallback-llm-system.ts` | Provider par défaut = NVIDIA (modèle via `NVIDIA_DEFAULT_MODEL`). |
| `src/services/firestore-service.ts` | Connexion automatique à l'émulateur Firestore quand `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`. |
| `package.json` | Dépendance `@genkit-ai/googleai` remplacée par `@genkit-ai/compat-oai`. |
| `.env.local.example` | Modèle de configuration NVIDIA + émulateur. |

Les 12 *flows* (`src/ai/flows/`) et les *tools* (`src/ai/tools/`) sont **inchangés** :
ils utilisent tous l'objet `ai` centralisé, donc la bascule de provider est
transparente.

---

## Points de vigilance NVIDIA (à tester après installation)

1. **Sorties structurées (JSON/Zod).** 12 flows demandent un JSON conforme à un
   schéma. Tous les modèles NVIDIA ne supportent pas le `response_format` de
   façon égale. Si un flow renvoie une erreur de parsing, essayez un autre
   modèle (Llama 3.3 / Nemotron sont les plus fiables) ou réduisez la
   complexité du schéma.

2. **Function calling.** 4 flows utilisent des *tools*
   (`agent-reasoning`, `agent-collaboration-flow`, `auto-agent-selector`).
   Vérifiez que le modèle choisi annonce `tool_calling` sur build.nvidia.com.

3. **Rate limits du tier gratuit.** Le `fallback-llm-system` fait un
   *health-check* toutes les 60 s et les simulations multi-agents génèrent de
   nombreux appels. En cas d'erreurs 429, espacez les requêtes, réduisez le
   nombre d'agents, ou augmentez les délais de retry.

4. **Coût en crédits.** Les endpoints gratuits consomment les crédits offerts.
   Surveillez votre quota sur le tableau de bord NVIDIA Build.

## Dépannage rapide

- **`NVIDIA_API_KEY est manquant`** dans la console → `.env.local` non chargé ou
  clé absente. Redémarrez `npm run dev` après modification.
- **Firestore timeout / `UNAVAILABLE`** → l'émulateur (terminal A) n'est pas
  démarré, ou le port 8080 diffère de `.env.local`.
- **Erreur de parsing JSON sur un flow** → voir point 1 ci-dessus (changer de modèle).
- **404 sur le modèle** → l'`id` du modèle est incorrect ou n'est pas un
  endpoint gratuit. Vérifiez l'identifiant exact sur build.nvidia.com/models.
