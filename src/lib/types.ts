import type { LucideIcon } from 'lucide-react';

export interface Agent {
  id: string;
  role: string;
  specialization: string;
  prompt: string;
  icon: LucideIcon;
}

export interface PromptVersion {
  id: string;
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
