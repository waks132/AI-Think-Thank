import { config } from 'dotenv';
config();

import '@/ai/flows/prompt-divergence-metrics.ts';
import '@/ai/flows/auto-prompt-curator.ts';
import '@/ai/flows/agent-reasoning.ts';
import '@/ai/flows/ai-team-simulator.ts';
import '@/ai/flows/adaptive-prompt-rewriter.ts';
import '@/ai/flows/cognitive-heatmap-flow.ts';
import '@/ai/flows/causal-flow-tracker-flow.ts';
