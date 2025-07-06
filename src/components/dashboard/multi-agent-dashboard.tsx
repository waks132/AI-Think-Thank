"use client"

import { useState, useMemo } from 'react';
import { 
  BrainCircuit, FlaskConical, ClipboardCheck, Lightbulb, Scale, FunctionSquare,
  Compass, Shield, Brain, Layers, BookOpen, Search, Drama, Milestone,
  Zap, MessageSquare, Palette, Recycle, Code, Mic, Anchor, GitBranch, Users, Loader2, Sparkles, FileText,
  ShieldCheck
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
import { useLanguage } from '@/context/language-context';
import { t } from '@/lib/i18n';
import { personaList } from '@/lib/personas';


export default function MultiAgentDashboard() {
  const { language } = useLanguage();

  const initialAgents = useMemo(() => personaList.filter(p => p.id !== 'disruptor').map(p => ({
    id: p.id,
    role: p.name[language],
    specialization: p.specialization[language],
    prompt: p.values[language],
    icon: p.icon,
  })), [language]);

  const [storedAgents, setStoredAgents] = useLocalStorage<Agent[]>('agents', initialAgents);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set(['kairos-1', 'helios', 'veritas']));
  const [mission, setMission] = useState<string>('Développer un cadre pour le déploiement éthique de l\'IA dans les véhicules autonomes.');
  const [collaborationResult, setCollaborationResult] = useState<AgentCollaborationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast();

  const agents = useMemo(() => {
    return storedAgents.map(agent => {
      const persona = personaList.find(p => p.id === agent.id);
      if (persona) {
        return {
          ...agent, // has the user's prompt
          role: persona.name[language],
          specialization: persona.specialization[language],
          icon: persona.icon,
        }
      }
      return agent;
    });
  }, [storedAgents, language]);

  const agentIconMap = useMemo(() => new Map(personaList.flatMap(p => [
    [p.name['fr'], p.icon],
    [p.name['en'], p.icon],
  ])), []);

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
        language,
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
        <h1 className="text-3xl font-bold font-headline mb-2">{t.dashboard.title[language]}</h1>
        <p className="text-muted-foreground">{t.dashboard.description[language]}</p>
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <Users />
            {t.dashboard.hub_title[language]}
          </CardTitle>
          <CardDescription>{t.dashboard.hub_description[language]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mission-description">{t.dashboard.mission_label[language]}</Label>
            <Textarea 
              id="mission-description"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder={t.dashboard.mission_placeholder[language]}
              rows={3}
            />
          </div>
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <Button onClick={handleStartMission} disabled={isLoading} className="w-full">
            {isLoading ? (
              <><Loader2 className="mr-2 animate-spin" /> {t.dashboard.start_button_loading[language]}</>
            ) : (
              <><Sparkles className="mr-2" /> {t.dashboard.start_button[language]} ({selectedAgentIds.size} {t.dashboard.agents_selected[language]})</>
            )}
          </Button>

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{t.dashboard.loading_text[language]}</p>
            </div>
          )}

          {collaborationResult && (
            <div className="space-y-4 animate-fade-in pt-4">
              <Separator />
              <h3 className="font-headline text-xl">{t.dashboard.outcome_title[language]}</h3>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText />{t.dashboard.summary_title[language]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{collaborationResult.executiveSummary}</p>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BrainCircuit />{t.dashboard.reasoning_title[language]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground">{collaborationResult.reasoning}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                   <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck />{t.dashboard.assessment_title[language]}</CardTitle>
                        <CardDescription>{t.dashboard.assessment_description[language]}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <Label className="text-sm">{t.dashboard.clarity_label[language]}</Label>
                            <span className="font-bold text-primary">{collaborationResult.validationGrid.clarity.toFixed(2)}</span>
                          </div>
                          <Progress value={collaborationResult.validationGrid.clarity * 100} />
                        </div>
                         <div className="space-y-1">
                           <div className="flex justify-between items-baseline">
                            <Label className="text-sm">{t.dashboard.synthesis_label[language]}</Label>
                            <span className="font-bold text-primary">{collaborationResult.validationGrid.synthesis.toFixed(2)}</span>
                           </div>
                          <Progress value={collaborationResult.validationGrid.synthesis * 100} />
                        </div>
                         <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <Label className="text-sm">{t.dashboard.ethics_label[language]}</Label>
                            <span className="font-bold text-primary">{collaborationResult.validationGrid.ethics.toFixed(2)}</span>
                           </div>
                          <Progress value={collaborationResult.validationGrid.ethics * 100} />
                        </div>
                         <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <Label className="text-sm">{t.dashboard.scalability_label[language]}</Label>
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
                                    <div className="flex items-center gap-2 text-lg font-headline"><MessageSquare />{t.dashboard.log_title[language]}</div>
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
                                                            <span className="text-xs text-muted-foreground font-mono">{t.dashboard.turn[language]} {log.turn}</span>
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
        <h2 className="text-2xl font-bold font-headline mb-2">{t.dashboard.roster_title[language]}</h2>
        <p className="text-muted-foreground mb-6">{t.dashboard.roster_description[language]}</p>
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
