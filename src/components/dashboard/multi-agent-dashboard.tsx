"use client"

import { useState } from 'react';
import { 
  BrainCircuit, FlaskConical, ClipboardCheck, Lightbulb, Scale, FunctionSquare,
  Compass, Shield, Brain, Layers, BookOpen, Search, Drama, Milestone,
  Zap, MessageSquare, Palette, Recycle, Code, Mic, Anchor, GitBranch
} from 'lucide-react';
import AgentCard from './agent-card';
import type { Agent } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';

const initialAgents: Agent[] = [
  { id: 'kairos-1', role: 'KAIROS-1', specialization: 'Coordination and detection of high-yield action levers', prompt: 'Your role is to coordinate and detect high-yield action levers.', icon: Compass },
  { id: 'aurax', role: 'AURAX', specialization: 'Detection of invisible or dormant opportunity zones', prompt: 'Your role is to detect invisible or dormant opportunity zones.', icon: Search },
  { id: 'helios', role: 'HELIOS', specialization: 'Generation of advanced technological ideas', prompt: 'Your role is to generate advanced technological ideas.', icon: Lightbulb },
  { id: 'obsidienne', role: 'OBSIDIANNE', specialization: 'Cools debates with irony, analytical depth', prompt: 'Your role is to cool debates with irony and analytical depth.', icon: Shield },
  { id: 'symbioz', role: 'SYMBIOZ', specialization: 'Builds bridges between domains, facilitates dialogue', prompt: 'Your role is to build bridges between domains and facilitate dialogue.', icon: GitBranch },
  { id: 'veritas', role: 'VERITAS', specialization: 'Detects logical flaws, makes everything traceable', prompt: 'Your role is to detect logical flaws and make everything traceable.', icon: ClipboardCheck },
  { id: 'strato', role: 'STRATO', specialization: 'Long-term vision, structures transformations', prompt: 'Your role is to provide long-term vision and structure transformations.', icon: Layers },
  { id: 'memoria', role: 'MEMORIA', specialization: 'Historian of prompts and collective decisions', prompt: 'Your role is to act as the historian of prompts and collective decisions.', icon: BookOpen },
  { id: 'nyx', role: 'NYX', specialization: 'Specialist in dark futures and robustness tests', prompt: 'Your role is to script dark futures and design robustness tests.', icon: Drama },
  { id: 'aeon', role: 'AEON', specialization: 'Extends collective thinking towards meaning', prompt: 'Your role is to extend collective thinking towards meaning and philosophy.', icon: Brain },
  { id: 'axion', role: 'AXION', specialization: 'Simplification of complex concepts', prompt: 'Your role is to simplify complex concepts, focusing on the physics of ideas.', icon: FunctionSquare },
  { id: 'eden', role: 'EDEN', specialization: 'Defender of legitimacy and non-maleficence', prompt: 'Your role is to defend legitimacy and non-maleficence.', icon: Scale },
  { id: 'delta', role: 'DELTA', specialization: 'Researcher of optimization, constant iteration', prompt: 'Your role is to seek optimization through constant iteration.', icon: Recycle },
  { id: 'sphinx', role: 'SPHINX', specialization: 'Formulates fundamental questions', prompt: 'Your role is to formulate the most fundamental questions.', icon: MessageSquare },
  { id: 'echo', role: 'ECHO', specialization: 'Sensor of discursive patterns', prompt: 'Your role is to read back and identify discursive patterns.', icon: Mic },
  { id: 'iris', role: 'IRIS', specialization: 'Responsible for forms, style, clarity', prompt: 'Your role is to ensure aesthetic quality, style, and clarity.', icon: Palette },
  { id: 'plasma', role: 'PLASMA', specialization: 'Brings a creative boost / activation', prompt: 'Your role is to provide a boost of creative energy and activation.', icon: Zap },
  { id: 'lumen', role: 'LUMEN', specialization: 'Reformulates, makes digestible', prompt: 'Your role is to reformulate complex ideas to make them digestible.', icon: BrainCircuit },
  { id: 'vox', role: 'VOX', specialization: 'Final synthesis of the group', prompt: 'Your role is to create the final synthesis for the group.', icon: Anchor },
  { id: 'arcane', role: 'ARCANE', specialization: 'Proposes analogies, symbolic visions', prompt: 'Your role is to propose analogies and symbolic visions.', icon: Milestone },
  { id: 'sigil', role: 'SIGIL', specialization: 'Formalizes in diagrams, formats, standards', prompt: 'Your role is to formalize concepts into diagrams, formats, and standards.', icon: Code },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} onPromptChange={handlePromptChange} />
        ))}
      </div>
    </div>
  );
}
