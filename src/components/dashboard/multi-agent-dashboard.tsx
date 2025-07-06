"use client"

import { useState, useMemo } from 'react';
import { 
  BrainCircuit, FlaskConical, ClipboardCheck, Lightbulb, Scale, FunctionSquare,
  Compass, Shield, Brain, Layers, BookOpen, Search, Drama, Milestone,
  Zap, MessageSquare, Palette, Recycle, Code, Mic, Anchor, GitBranch, Users, Loader2, Sparkles, FileText,
  ShieldCheck, CheckCircle, XCircle
} from 'lucide-react';
import AgentCard from './agent-card';
import type { Agent } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { runAgentCollaboration, type AgentCollaborationOutput } from '@/ai/flows/agent-collaboration-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import ModelSelector from '../model-selector';
import { availableModels } from '@/lib/models';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Progress } from '../ui/progress';

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

const initialAgentsMap = new Map(initialAgents.map(agent => [agent.id, agent.icon]));


export default function MultiAgentDashboard() {
  const [storedAgents, setStoredAgents] = useLocalStorage<Agent[]>('agents', initialAgents);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set(['kairos-1', 'helios', 'veritas']));
  const [mission, setMission] = useState<string>('Develop a framework for ethical AI deployment in autonomous vehicles.');
  const [collaborationResult, setCollaborationResult] = useState<AgentCollaborationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast();

  const agents = useMemo(() => {
    return storedAgents.map(agent => ({
      ...agent,
      icon: initialAgentsMap.get(agent.id) || BrainCircuit
    }));
  }, [storedAgents]);

  const agentIconMap = new Map(agents.map(agent => [agent.role, agent.icon]));

  const handlePromptChange = (agentId: string, newPrompt: string) => {
    setStoredAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === agentId ? { ...agent, prompt: newPrompt } : agent
      )
    );
  };

  const handleAgentSelectionChange = (agentId: string, isSelected: boolean) => {
    setSelectedAgentIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(agentId);
      } else {
        newSet.delete(agentId);
      }
      return newSet;
    });
  };

  const handleStartMission = async () => {
    if (selectedAgentIds.size < 2) {
      toast({
        variant: 'destructive',
        title: 'Selection Error',
        description: 'Please select at least two agents for collaboration.',
      });
      return;
    }

    setIsLoading(true);
    setCollaborationResult(null);

    const participatingAgents = agents
      .filter(agent => selectedAgentIds.has(agent.id))
      .map(({ role, prompt }) => ({ role, prompt }));

    try {
      const result = await runAgentCollaboration({
        mission,
        agents: participatingAgents,
        model: selectedModel,
      });
      setCollaborationResult(result);
    } catch (error) {
      console.error("Error during agent collaboration:", error);
      toast({
        variant: "destructive",
        title: "Collaboration Failed",
        description: "The mission could not be completed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Multi-Agent Dashboard</h1>
        <p className="text-muted-foreground">Orchestrate your cognitive collective. Define missions and manage your team of AI agents.</p>
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <Users />
            Mission Hub
          </CardTitle>
          <CardDescription>Define a mission, select your agents, and launch the collaboration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mission-description">Mission Description</Label>
            <Textarea 
              id="mission-description"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Enter the mission objective for the collective..."
              rows={3}
            />
          </div>
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <Button onClick={handleStartMission} disabled={isLoading} className="w-full">
            {isLoading ? (
              <><Loader2 className="mr-2 animate-spin" /> Orchestrating...</>
            ) : (
              <><Sparkles className="mr-2" /> Start Mission ({selectedAgentIds.size} agents)</>
            )}
          </Button>

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cognitive collective is deliberating...</p>
            </div>
          )}

          {collaborationResult && (
            <div className="space-y-4 animate-fade-in pt-4">
              <Separator />
              <h3 className="font-headline text-xl">Mission Outcome</h3>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText />Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{collaborationResult.executiveSummary}</p>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BrainCircuit />Reasoning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground">{collaborationResult.reasoning}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                   <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck />Cognitive Assessment</CardTitle>
                        <CardDescription>Multi-axis scoring of the collective output.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <Label className="text-sm">Clarity & Reasoning</Label>
                            <span className="font-bold text-primary">{collaborationResult.validationGrid.clarity.toFixed(2)}</span>
                          </div>
                          <Progress value={collaborationResult.validationGrid.clarity * 100} />
                        </div>
                         <div className="space-y-1">
                           <div className="flex justify-between items-baseline">
                            <Label className="text-sm">Collective Synthesis</Label>
                            <span className="font-bold text-primary">{collaborationResult.validationGrid.synthesis.toFixed(2)}</span>
                           </div>
                          <Progress value={collaborationResult.validationGrid.synthesis * 100} />
                        </div>
                         <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <Label className="text-sm">Ethical Robustness</Label>
                            <span className="font-bold text-primary">{collaborationResult.validationGrid.ethics.toFixed(2)}</span>
                           </div>
                          <Progress value={collaborationResult.validationGrid.ethics * 100} />
                        </div>
                         <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <Label className="text-sm">Scalability</Label>
                            <span className="font-bold text-primary">{collaborationResult.validationGrid.scalability.toFixed(2)}</span>
                           </div>
                          <Progress value={collaborationResult.validationGrid.scalability * 100} />
                        </div>
                      </CardContent>
                    </Card>

                    {collaborationResult.collaborationLog && collaborationResult.collaborationLog.length > 0 && (
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2 text-lg font-headline"><MessageSquare />View Collaboration Log</div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-6 max-h-[400px] overflow-y-auto p-4 border rounded-lg bg-background/50">
                                        {collaborationResult.collaborationLog.map((log) => {
                                            const Icon = agentIconMap.get(log.agentRole) || BrainCircuit;
                                            return (
                                                <div key={log.turn} className="flex items-start gap-4 animate-fade-in">
                                                    <div className="p-2 bg-accent rounded-full">
                                                        <Icon className="h-5 w-5 text-accent-foreground" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline justify-between">
                                                            <p className="font-semibold text-primary">{log.agentRole}</p>
                                                            <span className="text-xs text-muted-foreground font-mono">Turn {log.turn}</span>
                                                        </div>
                                                        <p className="text-sm text-foreground/90">{log.contribution}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold font-headline mb-2">Agent Roster</h2>
        <p className="text-muted-foreground mb-6">Select agents for the mission and edit their core prompts to adapt their behavior.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onPromptChange={handlePromptChange} 
              isSelected={selectedAgentIds.has(agent.id)}
              onSelectionChange={handleAgentSelectionChange}
              selectedModel={selectedModel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
