import type { AgentContribution } from './ai/flows/agent-collaboration-flow';

export interface Agent {
  id: string;
  role: string;
  specialization: string;
  prompt: string;
  lastPsiScore?: number | null;
}

export interface PromptVersion {
  id:string;
  prompt: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  agentId: string;
  agentRole: string;
  message: string;
  annotation?: string;
  timestamp: string;
}

export interface HeatmapWord {
    word: string;
    weight: number;
}

export type { AgentContribution };
