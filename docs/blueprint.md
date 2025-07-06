# **App Name**: Cognitive Collective

## Core Features:

- Adaptive Prompt Orchestration: An orchestrator tool that rewrites prompts adaptively based on agent performance and identified lacunae (e.g., lack of factual accuracy, redundancy).
- Multi-Agent Dashboard: A dashboard displaying multiple agents with their respective roles, specializations, and editable prompts.
- Prompt Lineage Viewer: A tool visualizing the evolution of prompts, allowing comparison between versions and reversion to stable ancestors for controlled experimentation.
- Annotated Cognitive Log Viewer: The UI component displays journaled conversations with automatic annotations (e.g., "Agent A corrected Agent B," "Agent C introduced a new hypothesis").
- Conversation Logger: Capturing all agent interactions to track contributions, impact, and redundancy; persistence handled via localStorage.
- Reasoning Provided: Each agent should provide its reasoning, using Chain of Thought prompting
- Métriques de divergence: Métriques de divergence (KL divergence entre versions de prompts)
- Heatmap cognitive: Heatmap cognitive des zones d’activation sémantique (par mots, concepts)
- Causal Flow Tracker: quels agents influencent quelles décisions
- Auto-curation de prompts: suppression/archivage de prompts peu utiles ou redondants
- Simulations d’équipe IA vs IA: Simulations d’équipe IA vs IA pour tester des stratégies de résolution

## Style Guidelines:

- Primary color: HSL(210, 70%, 50%) -- a vibrant, clean blue, converted to hex: #3692E9 -- to reflect clarity and intelligence.
- Background color: HSL(210, 20%, 95%) -- a light, desaturated blue that is easy on the eyes, converted to hex: #F0F4F8.
- Accent color: HSL(180, 60%, 40%) -- a contrasting, desaturated teal, converted to hex: #29A69E -- to highlight interactive elements without overwhelming the user.
- Headline font: 'Space Grotesk' (sans-serif) for headlines and short amounts of body text; if longer text is anticipated, use this for headlines and 'Inter' for body.
- Use clean, minimalist icons to represent agents and their roles. Icons should be monochromatic, using the primary or accent color based on context.
- Employ a modular layout with clear divisions between agents and functions. Use grid systems to maintain a structured and scalable design.
- Implement subtle transitions and animations to indicate changes in agent states or prompt updates, enhancing user experience without being distracting.