# 📋 PLAN DE TRAVAIL - CORRECTION COMPLÈTE AI-THINK-THANK

**Date de création**: 2025-11-13
**Exécuteur**: Claude Code
**Durée estimée**: 2-4 heures
**Objectif**: Corriger toutes les 24 erreurs TypeScript et problèmes critiques

---

## 🎯 OBJECTIFS

- ✅ Éliminer les 24 erreurs TypeScript
- ✅ Corriger les 3 problèmes critiques React
- ✅ Rendre le projet compilable et déployable
- ✅ Valider le build de production

---

## 📊 PHASE 1: CORRECTIONS TYPESCRIPT (Durée: 90 min)

### Étape 1.1: Configuration TypeScript (5 min)
**Fichier**: `tsconfig.json`
- [ ] Modifier `target: "ES2017"` → `target: "ES2018"`
- [ ] Sauvegarder le fichier
- [ ] Validation: `npm run typecheck` - devrait éliminer 3 erreurs regex

### Étape 1.2: Correction du type AgentContribution (3 min)
**Fichier**: `src/lib/types.ts`
- [ ] Corriger l'import `./ai/flows/...` → `@/ai/flows/...`
- [ ] Ajouter l'interface `CausalLink`
- [ ] Sauvegarder
- [ ] Validation: `npm run typecheck` - devrait éliminer 2 erreurs

### Étape 1.3: Migration API Genkit Tools (25 min)
**Fichier**: `src/ai/tools/knowledge-base-tool.ts`
- [ ] Remplacer `input: { schema: ... }` par `inputSchema: ...`
- [ ] Remplacer `output: { schema: ... }` par `outputSchema: ...`
- [ ] Sauvegarder

**Fichier**: `src/ai/tools/mission-archive-tool.ts`
- [ ] Même transformation que knowledge-base-tool
- [ ] Sauvegarder
- [ ] Validation: `npm run typecheck` - devrait éliminer 2 erreurs

### Étape 1.4: Suppression des options `retries` (20 min)
**10 fichiers à corriger**:
1. [ ] `src/ai/flows/adaptive-prompt-rewriter.ts:93`
2. [ ] `src/ai/flows/agent-reasoning.ts:77`
3. [ ] `src/ai/flows/ai-team-simulator.ts:126`
4. [ ] `src/ai/flows/auto-agent-selector.ts:171`
5. [ ] `src/ai/flows/auto-prompt-curator.ts:95`
6. [ ] `src/ai/flows/causal-flow-tracker-flow.ts:61`
7. [ ] `src/ai/flows/cognitive-heatmap-flow.ts:55`
8. [ ] `src/ai/flows/prompt-divergence-metrics.ts:66`
9. [ ] `src/ai/flows/report-generator-flow.ts:90`
10. [ ] `src/ai/flows/strategic-synthesis-critique.ts:64`
- [ ] Validation: `npm run typecheck` - devrait éliminer 10 erreurs

### Étape 1.5: Correction du type unknown (3 min)
**Fichier**: `src/ai/flows/agent-collaboration-flow.ts:200`
- [ ] Ajouter type guard pour `parseError`
- [ ] Sauvegarder
- [ ] Validation: `npm run typecheck` - devrait éliminer 1 erreur

### Étape 1.6: Correction impossible-problems-solver.ts (15 min)
**Fichier**: `src/lib/impossible-problems-solver.ts`
- [ ] Ligne 171: Ajouter `Record<string, string>` pour breakthroughs
- [ ] Ligne 213-214: Ajouter types pour implementations/verifications
- [ ] Ligne 261: Changer `complexity: 'temporal'` → `'multi-dimensional'`
- [ ] Sauvegarder
- [ ] Validation: `npm run typecheck` - devrait éliminer 4 erreurs

### Étape 1.7: Correction firestore-service.ts (10 min)
**Fichier**: `src/services/firestore-service.ts`
- [ ] Ligne 87: Ajouter contrainte `T extends Record<string, any>`
- [ ] Ligne 90: Ajouter `as any` pour setDoc
- [ ] Ligne 99: Ajouter contrainte `T extends Record<string, any>`
- [ ] Ligne 102: Ajouter `as any` pour addDoc
- [ ] Sauvegarder
- [ ] Validation: `npm run typecheck` - devrait éliminer 2 erreurs

### Étape 1.8: Correction auto-agent-selector.ts (5 min)
**Fichier**: `src/ai/flows/auto-agent-selector.ts`
- [ ] Ligne 175: Ajouter optional chaining ou vérifier le schema
- [ ] Sauvegarder
- [ ] Validation: `npm run typecheck` - devrait éliminer 1 erreur

### ✅ CHECKPOINT PHASE 1
- [ ] Exécuter: `npm run typecheck`
- [ ] **ATTENDU**: 0 erreur TypeScript
- [ ] Si erreurs restantes: analyser et corriger
- [ ] Commit: "fix: corriger toutes les erreurs TypeScript (24 erreurs)"

---

## 🔴 PHASE 2: CORRECTIONS CRITIQUES REACT (Durée: 30 min)

### Étape 2.1: Imports CommonJS → ES6 (5 min)
**Fichier**: `src/components/tools/divergence-metrics-tool.tsx:22`
- [ ] Remplacer `const diff = require('diff')` par `import { diffWords } from 'diff'`
- [ ] Sauvegarder

**Fichier**: `src/components/tools/prompt-lineage-viewer.tsx:16`
- [ ] Même transformation
- [ ] Sauvegarder

### Étape 2.2: Correction persistance ai-team-simulator (15 min)
**Fichier**: `src/components/tools/ai-team-simulator.tsx`
- [ ] Identifier tous les useState/useLocalStorage
- [ ] Remplacer par useFirestore pour cohérence
- [ ] Tester la logique
- [ ] Sauvegarder

### Étape 2.3: Ajouter "use client" si nécessaire (5 min)
**Vérifier tous les composants tools**:
- [ ] Ajouter `'use client'` en haut si hooks utilisés
- [ ] Sauvegarder

### ✅ CHECKPOINT PHASE 2
- [ ] Exécuter: `npm run typecheck`
- [ ] **ATTENDU**: 0 erreur, 0 warning critique
- [ ] Commit: "fix: corriger les problèmes critiques React"

---

## 🏗️ PHASE 3: VALIDATION BUILD (Durée: 20 min)

### Étape 3.1: Test de compilation (10 min)
- [ ] Exécuter: `npm run typecheck`
- [ ] Exécuter: `npm run build`
- [ ] **ATTENDU**: Build réussi sans erreur
- [ ] Si échec: analyser les logs et corriger

### Étape 3.2: Test du serveur dev (10 min)
- [ ] Exécuter: `npm run dev`
- [ ] Ouvrir localhost:9002
- [ ] Vérifier que la page charge
- [ ] Tester 2-3 flows AI basiques
- [ ] Arrêter le serveur

### ✅ CHECKPOINT PHASE 3
- [ ] Build: ✅ Réussi
- [ ] Dev server: ✅ Fonctionne
- [ ] Commit: "chore: validation build et serveur dev"

---

## 🚀 PHASE 4: COMMIT ET PUSH (Durée: 10 min)

### Étape 4.1: Vérification finale
- [ ] `npm run typecheck` → 0 erreur
- [ ] `git status` → Vérifier les fichiers modifiés
- [ ] `git diff` → Vérifier les changements

### Étape 4.2: Commit et push
- [ ] `git add .`
- [ ] Commit avec message détaillé
- [ ] Push vers `claude/analyse-gl-01CZPUbD5XyJwmZ1rPt5YVxc`

---

## 📝 LISTE COMPLÈTE DES FICHIERS À MODIFIER

### Configuration (1 fichier)
1. `tsconfig.json`

### Types (1 fichier)
2. `src/lib/types.ts`

### AI Tools (2 fichiers)
3. `src/ai/tools/knowledge-base-tool.ts`
4. `src/ai/tools/mission-archive-tool.ts`

### AI Flows (11 fichiers)
5. `src/ai/flows/adaptive-prompt-rewriter.ts`
6. `src/ai/flows/agent-collaboration-flow.ts`
7. `src/ai/flows/agent-reasoning.ts`
8. `src/ai/flows/ai-team-simulator.ts`
9. `src/ai/flows/auto-agent-selector.ts`
10. `src/ai/flows/auto-prompt-curator.ts`
11. `src/ai/flows/causal-flow-tracker-flow.ts`
12. `src/ai/flows/cognitive-heatmap-flow.ts`
13. `src/ai/flows/prompt-divergence-metrics.ts`
14. `src/ai/flows/report-generator-flow.ts`
15. `src/ai/flows/strategic-synthesis-critique.ts`

### Lib (2 fichiers)
16. `src/lib/impossible-problems-solver.ts`
17. `src/services/firestore-service.ts`

### Components (2 fichiers)
18. `src/components/tools/divergence-metrics-tool.tsx`
19. `src/components/tools/prompt-lineage-viewer.tsx`
20. `src/components/tools/ai-team-simulator.tsx` (optionnel)

**TOTAL**: 20 fichiers à modifier

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] 0 erreur TypeScript (`npm run typecheck`)
- [ ] Build réussi (`npm run build`)
- [ ] Serveur dev démarre (`npm run dev`)
- [ ] Tous les flows AI fonctionnent
- [ ] Code committé et pushé
- [ ] Score qualité passé de 62/100 → 75/100

---

## 🎯 MÉTRIQUES DE PROGRESSION

| Métrique | Avant | Cible | Actuel |
|----------|-------|-------|--------|
| Erreurs TS | 24 | 0 | - |
| Problèmes critiques | 3 | 0 | - |
| Build | ❌ | ✅ | - |
| Score qualité | 62/100 | 75/100 | - |

---

**Note**: Ce plan sera suivi scrupuleusement, étape par étape, avec validation à chaque checkpoint.
