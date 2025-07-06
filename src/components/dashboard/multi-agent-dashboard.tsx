"use client"

import { useState } from 'react';
import { BrainCircuit, FlaskConical, ClipboardCheck, Lightbulb, Scale, FunctionSquare } from 'lucide-react';
import AgentCard from './agent-card';
import type { Agent } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';

const initialAgents: Agent[] = [
  { id: 'analyst', role: 'Analyst', specialization: 'Data interpretation and logical reasoning', prompt: 'Analyze the provided data and identify key patterns, anomalies, and insights. Provide a concise summary of your findings.', icon: BrainCircuit },
  { id: 'creative', role: 'Creative', specialization: 'Brainstorming and novel idea generation', prompt: 'Generate three unconventional and innovative solutions for the given problem. Think outside the box and challenge standard assumptions.', icon: Lightbulb },
  { id: 'fact_checker', role: 'Fact-Checker', specialization: 'Verifying information and ensuring accuracy', prompt: 'Review the following statements for factual accuracy. Cross-reference with reliable sources and flag any inaccuracies or unsubstantiated claims.', icon: ClipboardCheck },
  { id: 'ethicist', role: 'Ethicist', specialization: 'Evaluating moral and ethical implications', prompt: 'Assess the proposed solution from an ethical standpoint. Identify potential biases, fairness issues, and long-term societal impacts.', icon: Scale },
  { id: 'experimenter', role: 'Experimenter', specialization: 'Designing and running tests', prompt: 'Design a simple experiment to test the primary hypothesis. Define the methodology, control variables, and success metrics.', icon: FlaskConical },
  { id: 'integrator', role: 'Integrator', specialization: 'Synthesizing diverse inputs into a coherent whole', prompt: 'Synthesize the findings from all other agents into a single, cohesive action plan. Resolve any contradictions and present a unified recommendation.', icon: FunctionSquare },
];

export default function MultiAgentDashboard() {
  const [agents, setAgents] = useLocalStorage<Agent[]>('agents', initialAgents);

  const handlePromptChange = (agentId: string, newPrompt: string) => {
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === agentId ? { ...agent, prompt: newPrompt } : agent
      )
    );
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold font-headline mb-2">Multi-Agent Dashboard</h1>
      <p className="text-muted-foreground mb-6">Manage your team of AI agents. Edit their core prompts to adapt their behavior.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} onPromptChange={handlePromptChange} />
        ))}
      </div>
    </div>
  );
}
