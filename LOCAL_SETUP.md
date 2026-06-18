# AI-Think-Thank — Installation locale (NVIDIA NIM)

Version locale du think-tank multi-agents, fonctionnant **exclusivement avec les
endpoints gratuits de NVIDIA NIM** (compatibles OpenAI) et un **émulateur
Firebase local**. Aucune dépendance à Google Gemini ni à un Firestore cloud.

---

## 🚀 Lancement le plus simple (recommandé, sans connaissances techniques)

1. Installez **Node.js 20+** une seule fois : <https://nodejs.org> (bouton « LTS »).
   *(Optionnel, pour une base 100% locale : installez aussi Java — <https://adoptium.net>.)*
2. **Double-cliquez** sur le fichier correspondant à votre système :
   - **Windows** : `Lancer-Windows.bat`
   - **macOS** : `Lancer-Mac.command`
   - **Linux** : `Lancer-Linux.sh` (ou `./Lancer-Linux.sh` dans un terminal)
3. Au premier lancement, collez votre **clé NVIDIA** (`nvapi-…`) quand on vous la
   demande. On l'obtient gratuitement sur <https://build.nvidia.com>.

Le lanceur s'occupe de tout : vérification de Node, installation des
dépendances, création de la config, démarrage de la base locale (si Java est
présent) et de l'application, puis ouverture automatique du navigateur sur
<http://localhost:9002>. Pour arrêter : fermez la fenêtre (ou Ctrl+C).

> Équivalent en ligne de commande : `npm run local`.
>
> ℹ️ macOS peut afficher un avertissement de sécurité au premier double-clic :
> faites un clic droit sur le fichier → **Ouvrir** → **Ouvrir**.

---

## Installation manuelle (développeurs)

### 1. Prérequis

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

## Résultats des tests réels (modèles NVIDIA via Genkit)

Tests effectués sur les 9 modèles fournis, en reproduisant le pattern exact de
l'app (`definePrompt` + schéma Zod de sortie + `defineTool`). Capacités testées :
génération de base, mode JSON, JSON schema strict, function calling.

| Modèle | JSON | Tools | Combo tools+schéma | Vitesse | Retenu |
|---|---|---|---|---|---|
| `mistralai/mistral-large-3-675b-instruct-2512` | ✅ | ✅ | ✅ (avec directive anti-fences) | ⚡ rapide | ✅ **défaut** |
| `moonshotai/kimi-k2.6` | ✅ | ✅ | ✅ nativement | 🐢 ~60s | ✅ (robuste) |
| `deepseek-ai/deepseek-v4-pro` | ✅ | ✅ | ⚠️ très lent (>150s) | 🐢 | ✅ (secours) |
| `openai/gpt-oss-120b` | ✅ | ⚠️ | ❌ bug `ToolDescription` | ⚡ | ⚠️ JSON seul |
| `nvidia/llama-3.3-nemotron-super-49b` | ❌ vide | ✅ | ❌ | — | ❌ exclu |
| `meta/llama-4-maverick-17b` | ✅ | ❌ pas d'appel | ❌ | ⚡ | ❌ exclu |
| `mistralai/mistral-medium-3.5-128b` | ⚠️ | ✅ | ⚠️ | 🐢 15-66s | ❌ exclu |
| `z-ai/glm-5.1` | ⏱️ timeout | — | — | >90s | ❌ exclu |
| `qwen/qwen3.5-122b-a10b` | ⏱️ timeout | — | — | >90s | ❌ exclu |

### Ajustements appliqués au code suite aux tests

1. **Directive anti-fences** (`JSON_OUTPUT_DIRECTIVE` dans `src/ai/genkit.ts`).
   Quand on combine `tools` + sortie structurée, les modèles NVIDIA entourent
   souvent leur JSON de blocs markdown ```` ```json ```` ou ajoutent de la prose,
   ce qui casse le parsing de Genkit (`JSON5: invalid character`). La directive
   est ajoutée aux 4 flows à tools (`agent-reasoning`, `agent-collaboration` x2,
   `auto-agent-selector`) pour forcer un JSON brut. Validé empiriquement.

2. **Liste de modèles curée** (`src/lib/models.ts`) : seuls les 4 modèles qui
   passent les tests sont exposés dans l'UI ; les 5 défaillants sont exclus
   (avec justification en commentaire).

3. **Modèle par défaut** = `mistral-large-3` (meilleur compromis JSON+tools+vitesse).
   Pour les missions très lourdes en tools, `kimi-k2.6` est le plus fiable.

4. **Couche de résilience** (`src/ai/resilience.ts`) : `withLLMRetry` enveloppe
   les appels des flows à tools avec retry + backoff exponentiel (gère 429 et
   sorties structurées incomplètes).

5. **Paramètres de génération par modèle ET par type de flow**
   (`getModelConfig(model, profile)` dans `genkit.ts`). Fusion en couches :
   valeurs globales < config modèle (top_p, thinking…) < profil de flow
   (temperature + max_tokens). Profils :

   | Profil | temp | max_tokens | Flows |
   |---|---|---|---|
   | `precise` | 0.10 | 8192 | sélection d'agents (classification déterministe) |
   | `metrics` | 0.10 | 2048 | métriques de divergence (scoring court) |
   | `analytical` | 0.30 | 8192 | synthèse, rapports, heatmap, flux causal, curation |
   | `reasoning` | 0.45 | 6144 | raisonnement d'agent, critique stratégique |
   | `creative` | 0.85 | 4096 | contributions d'agents, clash cognitif, réécriture |

   ⚠️ Deux pièges du plugin vérifiés en test :
   - **`maxOutputTokens` est IGNORÉ** par `@genkit-ai/compat-oai` (jamais mappé
     vers `max_tokens`). On utilise donc `max_tokens` **brut**, qui passe via le
     passthrough des clés inconnues.
   - **deepseek `chat_template_kwargs.thinking`** : actuellement **`true`**
     (raisonnement profond, meilleure qualité, plus lent — peut atteindre les
     timeouts sur tools+schéma). Passez à `false` dans `genkit.ts` pour
     privilégier la vitesse (≈2× plus rapide) au détriment de la qualité.

## Points de vigilance NVIDIA (à tester après installation)

1. **Sorties structurées (JSON/Zod).** 12 flows demandent un JSON conforme à un
   schéma. La directive anti-fences (cf. ci-dessus) corrige les cas problématiques.
   Si un flow renvoie encore une erreur de parsing, basculez sur `kimi-k2.6`
   (le plus robuste) ou réduisez la complexité du schéma.

2. **Function calling.** 4 flows utilisent des *tools*
   (`agent-reasoning`, `agent-collaboration-flow`, `auto-agent-selector`).
   Évitez `llama-4-maverick` (ne déclenche pas les tools) et `gpt-oss-120b`
   (bug de sérialisation des tools via Genkit).

3. **Rate limits du tier gratuit (IMPORTANT).** Observé pendant les tests :
   `mistral-large-3` renvoie des **429 (RESOURCE_EXHAUSTED) très rapidement** en
   rafale. Le `fallback-llm-system` fait en plus un *health-check* toutes les
   60 s et les simulations multi-agents génèrent de nombreux appels parallèles.
   Recommandations :
   - réduire le nombre d'agents par mission ;
   - ne pas lancer plusieurs missions simultanément ;
   - en cas de 429 persistants, basculer le modèle par défaut sur un autre
     endpoint (chaque modèle a son propre quota) ;
   - envisager d'augmenter les délais de retry / désactiver le health-check
     périodique pour un usage local mono-utilisateur.

4. **Coût en crédits.** Les endpoints gratuits consomment les crédits offerts.
   Surveillez votre quota sur le tableau de bord NVIDIA Build.

## Routeur multi-fournisseurs (bascule intelligente)

L'app peut utiliser plusieurs fournisseurs LLM (tous compatibles OpenAI) et
**bascule automatiquement** de l'un à l'autre en cas d'échec (429, JSON
invalide, timeout…). Politique : **GRATUIT d'abord, PAYANT en secours**.

Ordre d'essai : **NVIDIA (gratuit)** → **OpenRouter `:free` (gratuit)** →
**Mistral (payant)** → **OpenAI (payant)**. Un fournisseur n'est activé que si
sa clé est dans `.env.local` :

```dotenv
NVIDIA_API_KEY=nvapi-...            # gratuit
OPENROUTER_API_KEY=sk-or-...        # gratuit (modèles :free découverts auto)
MISTRAL_API_KEY=...                 # payant (secours fiable)
OPENAI_API_KEY=sk-...               # payant (secours fiable : gpt-4o-mini)
```

- **Sélecteur d'agents / collaboration** (flows lourds) : sur le tier gratuit
  seul, c'est lent (~2 min, JSON parfois capricieux). **Dès qu'une clé payante
  est présente**, le routeur bascule sur `gpt-4o-mini` / `mistral-large-latest`
  en cas d'échec → **rapide et fiable**.
- **OpenRouter** : les modèles gratuits sont récupérés dynamiquement via son API
  `/models` (filtre `:free` + support des outils), avec cache 30 min.
- Dans l'UI, laissez le modèle sur **`auto`** pour profiter de la bascule ;
  ou forcez `nvidia/…`, `mistral/…`, `openai/…`, `openrouter/…`.

## Persistance des données (état des outils)

La version locale stocke l'état des modules (résultats des outils, agents,
mission, logs…) dans le **localStorage du navigateur** par défaut. Conséquences :

- ✅ **Tous les modules fonctionnent sans aucune base de données** ni connexion —
  plus d'erreur « Failed to get document because the client is offline ».
- ✅ L'état est conservé d'une session à l'autre (même navigateur).
- ℹ️ Pour repartir de zéro : videz le stockage du site (DevTools → Application →
  Local Storage) ou utilisez une fenêtre privée.
- ℹ️ Pour activer une vraie base partagée (multi-postes), mettez
  `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (émulateur local) **et** démarrez-le,
  ou `NEXT_PUBLIC_USE_FIREBASE=true` pour le cloud. La synchro Firebase est alors
  best-effort : toute erreur réseau est silencieuse et ne bloque jamais l'UI.

## Dépannage rapide

- **`NVIDIA_API_KEY est manquant`** dans la console → `.env.local` non chargé ou
  clé absente. Redémarrez `npm run dev` après modification.
- **Firestore timeout / `UNAVAILABLE`** → l'émulateur (terminal A) n'est pas
  démarré, ou le port 8080 diffère de `.env.local`.
- **Erreur de parsing JSON sur un flow** → voir point 1 ci-dessus (changer de modèle).
- **404 sur le modèle** → l'`id` du modèle est incorrect ou n'est pas un
  endpoint gratuit. Vérifiez l'identifiant exact sur build.nvidia.com/models.
