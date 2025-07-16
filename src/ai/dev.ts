'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/prompt-divergence-metrics.ts';
import '@/ai/flows/auto-prompt-curator.ts';
import '@/ai/flows/agent-reasoning.ts';
import '@/ai/flows/ai-team-simulator.ts';
import '@/ai/flows/adaptive-prompt-rewriter.ts';
import '@/ai/flows/cognitive-heatmap-flow.ts';
import '@/ai/flows/causal-flow-tracker-flow.ts';
import '@/ai/flows/agent-collaboration-flow.ts';
import '@/ai/flows/strategic-synthesis-critique.ts';
import '@/ai/flows/auto-agent-selector.ts';
import '@/ai/flows/report-generator-flow.ts';
import '@/ai/tools/knowledge-base-tool.ts';
import '@/ai/tools/mission-archive-tool.ts';
