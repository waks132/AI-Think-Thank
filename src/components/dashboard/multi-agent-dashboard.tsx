"use client"

import { useState, useMemo, useEffect } from 'react';
import { Users, Loader2, Sparkles, FileText, BrainCircuit, ShieldCheck, MessageSquare, WandSparkles } from 'lucide-react';
import AgentCard from './agent-card';
import type { Agent, LogEntry } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { runAgentCollaboration, type AgentCollaborationOutput } from '@/ai/flows/agent-collaboration-flow';
import { autoAgentSelector } from '@/ai/flows/auto-agent-selector';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
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
import { Skeleton } from '../ui/skeleton';


export default function MultiAgentDashboard() {
  const { language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [storedAgents, setStoredAgents] = useLocalStorage<Agent[]>('agents', []);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('cognitive-logs', []);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set(['kairos-1', 'helios', 'veritas']));
  const [mission, setMission] = useState<string>('Développer un cadre pour le déploiement éthique de l\'IA dans les véhicules autonomes.');
  const [collaborationResult, setCollaborationResult] = useLocalStorage<AgentCollaborationOutput | null>("collaboration-result", null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast();

  const agents: Agent[] = useMemo(() => {
    const allDashboardPersonas = personaList.filter(p => p.id !== 'disruptor');
    const storedAgentMap = new Map(storedAgents.map(a => [a.id, a]));

    const currentAgents = allDashboardPersonas.map(persona => {
      const storedAgent = storedAgentMap.get(persona.id);
      return {
        id: persona.id,
        role: persona.name[language],
        specialization: persona.specialization[language],
        prompt: storedAgent ? storedAgent.prompt : persona.values[language],
        icon: persona.icon,
      };
    });

    const newStoredAgents = currentAgents.map(agent => {
        const persona = personaList.find(p => p.id === agent.id);
        if (!persona) return null;
        return {
            id: agent.id,
            role: persona.name.en, // Stored role/specialization doesn't matter
            specialization: persona.specialization.en,
            prompt: agent.prompt,
            icon: agent.icon,
        }
    }).filter(Boolean) as Agent[];
    
    // This effect ensures newly added personas in code get added to local storage
    if (hasMounted && newStoredAgents.length > storedAgents.length) {
        setStoredAgents(newStoredAgents);
    }

    return currentAgents.sort((a, b) => a.id.localeCompare(b.id));
  }, [storedAgents, language, hasMounted, setStoredAgents]);
  
  const agentMap = useMemo(() => new Map(agents.map(a => [a.role, a])), [agents]);
  const agentIconMap = useMemo(() => {
    const map = new Map<string, React.ElementType>();
    personaList.forEach(p => {
      map.set(p.name.fr, p.icon);
      map.set(p.name.en, p.icon);
    });
    return map;
  }, []);


  const handlePromptChange = (agentId: string, newPrompt: string) => {
    setStoredAgents(prevAgents => {
      const agentIndex = prevAgents.findIndex(a => a.id === agentId);

      if (agentIndex !== -1) {
        // Agent exists, update it
        const newAgents = [...prevAgents];
        newAgents[agentIndex] = { ...newAgents[agentIndex], prompt: newPrompt };
        return newAgents;
      } else {
        // Agent does not exist in storage, add it
        const persona = personaList.find(p => p.id === agentId);
        if (!persona) return prevAgents; // Should not happen

        const newAgent: Agent = {
          id: persona.id,
          role: persona.name.en, // Stored role/specialization doesn't matter, it's overwritten by language
          specialization: persona.specialization.en,
          prompt: newPrompt,
          icon: persona.icon,
        };
        return [...prevAgents, newAgent];
      }
    });
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
        title: t.dashboard.toast_select_title[language],
        description: t.dashboard.toast_select_description[language],
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
      
      if (result.collaborationLog) {
        const newLogEntries: LogEntry[] = result.collaborationLog.map(log => ({
          id: `${new Date().toISOString()}-${log.turn}`,
          agentId: agentMap.get(log.agentRole)?.id || 'unknown',
          agentRole: log.agentRole,
          message: log.contribution,
          annotation: log.annotation,
          timestamp: new Date().toISOString(),
        }));
        
        setLogs(prevLogs => [...newLogEntries, ...prevLogs]);
        
        toast({
          title: t.dashboard.toast_log_title[language],
          description: t.dashboard.toast_log_description[language],
        });
      }

    } catch (error) {
      console.error("Error during agent collaboration:", error);
      toast({
        variant: "destructive",
        title: t.dashboard.toast_fail_title[language],
        description: t.dashboard.toast_fail_description[language],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestTeam = async () => {
      setIsSuggesting(true);
      try {
        const availableAgentsForFlow = agents.map(a => ({
          id: a.id,
          role: a.role,
          specialization: a.specialization,
        }));

        const result = await autoAgentSelector({
          mission,
          agents: availableAgentsForFlow,
          model: selectedModel,
          language,
        });

        if (result && result.recommendedAgentIds) {
          setSelectedAgentIds(new Set(result.recommendedAgentIds));
          toast({
            title: t.dashboard.toast_suggest_title[language],
            description: `${t.dashboard.toast_suggest_description[language]} ${result.reasoning}`,
            duration: 9000,
          });
        }
      } catch (error) {
        console.error("Error suggesting team:", error);
        toast({
          variant: "destructive",
          title: "Suggestion Failed",
          description: "Could not get an AI team suggestion. Please try again.",
        });
      } finally {
        setIsSuggesting(false);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={handleSuggestTeam} disabled={isLoading || isSuggesting} variant="outline">
                {isSuggesting ? (
                  <><Loader2 className="mr-2 animate-spin" /> {t.dashboard.suggest_team_loading[language]}</>
                ) : (
                  <><WandSparkles className="mr-2" /> {t.dashboard.suggest_team_button[language]}</>
                )}
              </Button>
              <Button onClick={handleStartMission} disabled={isLoading || isSuggesting}>
                {isLoading ? (
                  <><Loader2 className="mr-2 animate-spin" /> {t.dashboard.start_button_loading[language]}</>
                ) : (
                  <><Sparkles className="mr-2" /> {t.dashboard.start_button[language]} ({hasMounted ? selectedAgentIds.size : 0} {t.dashboard.agents_selected[language]})</>
                )}
              </Button>
            </div>

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
                                                         {log.annotation && (
                                                          <p className="mt-1 text-xs text-secondary font-medium italic">
                                                            -- {log.annotation}
                                                          </p>
                                                        )}
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
          {hasMounted ? agents.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onPromptChange={handlePromptChange} 
              isSelected={selectedAgentIds.has(agent.id)}
              onSelectionChange={handleAgentSelectionChange}
              selectedModel={selectedModel}
            />
          )) : Array.from({ length: 12 }).map((_, index) => (
            <Card key={index} className="flex flex-col h-full">
                <CardHeader className="flex flex-row items-start gap-4">
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-4 w-4" />
                    </div>
                    <div className="space-y-2 flex-grow">
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="space-y-2 h-full">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-[150px] w-full" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
