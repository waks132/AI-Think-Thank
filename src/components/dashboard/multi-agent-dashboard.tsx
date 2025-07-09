"use client"

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, Loader2, Sparkles, FileText, BrainCircuit, ShieldCheck, MessageSquare, WandSparkles, Check, AlertTriangle, Route, Hammer, Lightbulb } from 'lucide-react';
import AgentCard from './agent-card';
import type { Agent, LogEntry, PromptVersion } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { runAgentCollaboration, type AgentCollaborationOutput } from '@/ai/flows/agent-collaboration-flow';
import { autoAgentSelector, type AutoAgentSelectorOutput } from '@/ai/flows/auto-agent-selector';
import { strategicSynthesisCritique, type StrategicSynthesisCritiqueOutput } from '@/ai/flows/strategic-synthesis-critique';
import { adaptivePromptRewriter, type AdaptivePromptRewriterOutput } from '@/ai/flows/adaptive-prompt-rewriter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import ModelSelector from '../model-selector';
import { availableModels } from '@/lib/models';
import { Progress } from '../ui/progress';
import { useLanguage } from '@/context/language-context';
import { t } from '@/lib/i18n';
import { personaList } from '@/lib/personas';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { trackCausalFlow, type CausalFlowTrackerOutput } from '@/ai/flows/causal-flow-tracker-flow';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
const Diff = require('diff');

const ORCHESTRATOR_IDS = ['kairos-1', 'disruptor'];

const DiffView = ({ string1, string2 }: { string1: string; string2: string }) => {
    const differences = Diff.diffWords(string1, string2);
    return (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {differences.map((part: any, index: number) => {
                const style = part.added ? 'bg-green-500/20 text-green-200 p-0.5 rounded-sm' 
                            : part.removed ? 'bg-red-500/20 text-red-200 p-0.5 rounded-sm' 
                            : 'text-muted-foreground';
                return <span key={index} className={`${style} transition-colors duration-300`}>{part.value}</span>
            })}
        </pre>
    );
};

const CritiqueSection = ({ icon: Icon, title, items, color }: { icon: React.ElementType, title: string, items: string[], color: string }) => (
  <div className="py-2">
    <h4 className={cn("font-semibold flex items-center gap-2 mb-2", color)}>
      <Icon className="h-5 w-5" />
      {title}
    </h4>
    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm pl-2">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  </div>
);


export default function MultiAgentDashboard() {
  const { language } = useLanguage();
  const [isHydrated, setIsHydrated] = useState(false);
  const [agents, setAgents] = useLocalStorage<Agent[]>('agents', []);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('cognitive-logs', []);
  const [promptHistories, setPromptHistories] = useLocalStorage<Record<string, PromptVersion[]>>('prompt-histories', {});
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set(['helios', 'veritas', 'symbioz']));
  const [mission, setMission] = useLocalStorage<string>('mission-text', 'Développer un cadre pour le déploiement éthique de l\'IA dans les véhicules autonomes.');
  const [collaborationResult, setCollaborationResult] = useLocalStorage<AgentCollaborationOutput | null>("collaboration-result", null);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [critiqueResult, setCritiqueResult] = useState<StrategicSynthesisCritiqueOutput | null>(null);
  const [refinedSummary, setRefinedSummary] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast();
  const [, setCausalFlows] = useLocalStorage<CausalFlowTrackerOutput['causalFlows']>('causal-flow-result', []);

  const agentIconMap = useMemo(() => {
    const map = new Map<string, React.ElementType>();
    personaList.forEach(p => {
      map.set(p.name.fr, p.icon);
      map.set(p.name.en, p.icon);
    });
    return map;
  }, []);
  
  const allAvailableAgentsForFlow = useMemo(() => agents.map(a => ({
      id: a.id,
      role: a.role,
      specialization: a.specialization,
  })), [agents]);

  const triggerCausalFlowAnalysis = useCallback(async (currentLogs: LogEntry[]) => {
    if (currentLogs.length === 0) return;

    try {
      const result = await trackCausalFlow({
        logEntries: JSON.stringify(currentLogs.map((log, index) => ({ ...log, index }))),
        language,
      });
      setCausalFlows(result.causalFlows);
    } catch (error) {
      console.error("Automated Causal Flow Analysis Failed:", error);
    }
  }, [language, setCausalFlows]);

  const handlePromptChange = (agentId: string, newPrompt: string, refinementResult?: AdaptivePromptRewriterOutput) => {
    setAgents(prevAgents => 
      prevAgents.map(agent => 
        agent.id === agentId ? { ...agent, prompt: newPrompt, lastPsiScore: refinementResult?.psiScore ?? agent.lastPsiScore } : agent
      )
    );

    const newVersion: PromptVersion = {
      id: new Date().toISOString(),
      prompt: newPrompt,
      timestamp: new Date().toISOString(),
    };

    setPromptHistories(prevHistories => {
      const agentHistoryKey = `prompt-history-${agentId}`;
      const existingHistory = prevHistories[agentHistoryKey] || [];
      const updatedHistory = [newVersion, ...existingHistory].slice(0, 20);
      return { ...prevHistories, [agentHistoryKey]: updatedHistory };
    });
  };

  const handleAgentSelectionChange = (agentId: string, isSelected: boolean) => {
    if (ORCHESTRATOR_IDS.includes(agentId)) return;
    setSelectedAgentIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(agentId);
      else newSet.delete(agentId);
      return newSet;
    });
  };

  const handleStartMission = async () => {
    const finalSelectedIds = new Set(selectedAgentIds);
    const orchestratorsInRoster = agents.filter(a => ORCHESTRATOR_IDS.includes(a.id));
    orchestratorsInRoster.forEach(o => finalSelectedIds.add(o.id));

    if (finalSelectedIds.size < 2) {
      toast({
        variant: 'destructive',
        title: t.dashboard.toast_select_title[language],
        description: t.dashboard.toast_select_description[language],
      });
      return;
    }

    setIsCollaborating(true);
    setCollaborationResult(null);
    setRefinedSummary(null);
    setCritiqueResult(null);

    const agentListString = agents
      .filter(agent => finalSelectedIds.has(agent.id))
      .map(agent => `- **Agent ID:** ${agent.id}\n  - **Agent Role:** ${agent.role}\n  - **Core Directive:** "${agent.prompt}"`)
      .join('\n\n');

    try {
      const result = await runAgentCollaboration({
        mission,
        agentList: agentListString,
        model: selectedModel,
        language,
      });
      setCollaborationResult(result);
      
      if (result.collaborationLog) {
        const missionStartTime = new Date();
        const newLogEntries: LogEntry[] = result.collaborationLog.map((log, index) => ({
          id: `${missionStartTime.toISOString()}-${log.turn}`,
          agentId: log.agentId,
          agentRole: log.agentRole,
          message: log.contribution,
          annotation: log.annotation,
          timestamp: new Date(missionStartTime.getTime() + (index * 3000)).toISOString(),
        }));
        
        const updatedLogs = [...newLogEntries, ...logs];
        setLogs(updatedLogs);
        
        toast({
          title: t.dashboard.toast_log_title[language],
          description: t.dashboard.toast_log_description[language],
        });

        triggerCausalFlowAnalysis(newLogEntries);
      }

    } catch (error) {
      console.error("Error during agent collaboration:", error);
      toast({
        variant: "destructive",
        title: t.dashboard.toast_fail_title[language],
        description: (error as Error).message || t.dashboard.toast_fail_description[language],
      });
    } finally {
      setIsCollaborating(false);
    }
  };

  const handleSuggestTeam = async () => {
    setIsSuggesting(true);
    try {
      const result: AutoAgentSelectorOutput = await autoAgentSelector({
        mission,
        agents: allAvailableAgentsForFlow.filter(a => !ORCHESTRATOR_IDS.includes(a.id)),
        model: selectedModel,
        language,
      });

      if (result && result.recommendedAgentIds) {
        if (result.recommendedAgentIds.length > 0) {
          const recommendedSet = new Set(result.recommendedAgentIds);
          setSelectedAgentIds(recommendedSet);
          
          toast({
            title: `${t.dashboard.toast_suggest_title[language]}: ${result.missionClassification}`,
            description: (
              <div className="text-xs max-w-md">
                <p className="font-bold">{result.recommendation}</p>
                <p className="mt-2 whitespace-pre-wrap">{result.orchestrationRationale}</p>
                {result.paradigmNativeProtocol && (
                  <div className="mt-2 border-t pt-2 border-primary/20">
                    <p className="font-semibold">{t.dashboard.paradigm_protocol[language]}</p>
                    <p>
                      <span className="font-medium">{t.dashboard.paradigm_agents[language]}:</span> 
                      {result.paradigmNativeProtocol.mandatoryAgents.join(', ')}
                    </p>
                     <p>
                      <span className="font-medium">{t.dashboard.paradigm_innovations[language]}:</span> 
                      {result.paradigmNativeProtocol.innovations.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ),
            duration: 15000,
          });
        } else {
           setSelectedAgentIds(new Set());
           toast({
            variant: "destructive",
            title: `${t.dashboard.toast_suggest_title[language]}: ${result.missionClassification}`,
            description: (
              <div className="text-xs max-w-md">
                <p className="font-bold">{result.recommendation}</p>
                <p className="mt-2 whitespace-pre-wrap">{result.orchestrationRationale}</p>
              </div>
            ),
            duration: 15000,
          });
        }
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

  const handleRefineSummary = async () => {
      if (!collaborationResult?.executiveSummary) return;

      setIsRefining(true);
      setCritiqueResult(null);
      setRefinedSummary(null);

      try {
          // Step 1: Get the critique
          const critique = await strategicSynthesisCritique({
              synthesisText: collaborationResult.executiveSummary,
              scenario: mission,
              model: selectedModel,
              language,
          });
          setCritiqueResult(critique);
          
          // Step 2: Use the critique to rewrite the summary
          const performanceLacunae = `
  Based on a critical "Red Team" analysis, the following points were raised about the original summary. 
  Your task is to rewrite the original summary to address these points. You must reinforce the identified strengths and mitigate the weaknesses. The new summary should be more robust, insightful, and actionable.

  **Critical Analysis to Address:**
  - Strengths to emphasize: ${critique.strengths.join('; ')}.
  - Weaknesses to correct: ${critique.weaknesses.join('; ')}.
  - Potential unintended consequences to consider or mention: ${critique.unintendedConsequences.join('; ')}.
  - Practical implementation challenges to acknowledge: ${critique.implementationChallenges.join('; ')}.
  - Strategic recommendations to integrate or reflect: ${critique.recommendations.join('; ')}.
          `.trim();

          const refinement = await adaptivePromptRewriter({
              originalPrompt: collaborationResult.executiveSummary,
              agentPerformance: performanceLacunae,
              model: selectedModel,
              language,
          });
          
          setRefinedSummary(refinement.rewrittenPrompt);

      } catch (error) {
          console.error("Error refining summary:", error);
          toast({
              variant: "destructive",
              title: t.dashboard.toast_refine_fail_title[language],
              description: (error as Error).message || t.dashboard.toast_refine_fail_description[language],
          });
      } finally {
          setIsRefining(false);
      }
  };

  const handleAdoptRefinement = () => {
      if (refinedSummary && collaborationResult) {
          setCollaborationResult({
              ...collaborationResult,
              executiveSummary: refinedSummary,
          });
          toast({
              title: t.dashboard.toast_refine_success_title[language],
              description: t.dashboard.toast_refine_success_description[language],
          });
          setRefinedSummary(null);
          setCritiqueResult(null);
      }
  };

  const handleDiscardRefinement = () => {
      setRefinedSummary(null);
      setCritiqueResult(null);
  };


  useEffect(() => {
    // This effect handles the hydration on mount. It runs only once on the client.
    const storedAgents = JSON.parse(window.localStorage.getItem('agents') || '[]') as Partial<Agent>[];
    const storedAgentMap = new Map(storedAgents.map(a => a.id ? [a.id, a] : null).filter(Boolean) as [string, Partial<Agent>][]);
    
    const hydratedAgents = personaList.map(persona => {
      const storedAgent = storedAgentMap.get(persona.id);
      
      // Explicitly reconstruct the agent object to ensure data integrity
      // and prevent non-serializable data from being malformed.
      if (storedAgent) {
        return {
          id: persona.id,
          prompt: storedAgent.prompt || persona.values[language],
          lastPsiScore: storedAgent.lastPsiScore,
          role: persona.name[language],
          specialization: persona.specialization[language],
          icon: persona.icon,
        };
      } else {
        return {
          id: persona.id,
          role: persona.name[language],
          specialization: persona.specialization[language],
          prompt: persona.values[language],
          icon: persona.icon,
          lastPsiScore: null,
        };
      }
    });
    
    setAgents(hydratedAgents);
    setIsHydrated(true);
  }, [language, setAgents]);


  const sortedAgents = useMemo(() => {
      return [...agents].sort((a, b) => {
          const aIsOrchestrator = ORCHESTRATOR_IDS.includes(a.id);
          const bIsOrchestrator = ORCHESTRATOR_IDS.includes(b.id);
          if (aIsOrchestrator && !bIsOrchestrator) return -1;
          if (!aIsOrchestrator && bIsOrchestrator) return 1;
          return a.id.localeCompare(b.id);
      });
  }, [agents]);
  
  const finalSelectedAgentCount = useMemo(() => {
    if (!isHydrated) return 0;
    const finalSet = new Set(selectedAgentIds);
    const orchestratorsInRoster = agents.filter(a => ORCHESTRATOR_IDS.includes(a.id));
    orchestratorsInRoster.forEach(o => finalSet.add(o.id));
    return finalSet.size;
  }, [selectedAgentIds, agents, isHydrated]);

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
              <Button onClick={handleSuggestTeam} disabled={isCollaborating || isSuggesting || !isHydrated} variant="outline">
                {isSuggesting ? (
                  <><Loader2 className="mr-2 animate-spin" /> {t.dashboard.suggest_team_loading[language]}</>
                ) : (
                  <><WandSparkles className="mr-2" /> {t.dashboard.suggest_team_button[language]}</>
                )}
              </Button>
              <Button onClick={handleStartMission} disabled={isCollaborating || isSuggesting || !isHydrated}>
                {isCollaborating ? (
                  <><Loader2 className="mr-2 animate-spin" /> {t.dashboard.start_button_loading[language]}</>
                ) : (
                  <><Sparkles className="mr-2" /> {t.dashboard.start_button[language]} ({finalSelectedAgentCount} {t.dashboard.agents_selected[language]})</>
                )}
              </Button>
            </div>

          {isCollaborating && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{t.dashboard.loading_text[language]}</p>
            </div>
          )}

          {isHydrated && collaborationResult && (
            <div className="space-y-4 animate-fade-in pt-4">
              <Separator />
              <h3 className="font-headline text-xl flex items-center gap-4">
                {t.dashboard.outcome_title[language]}
                 <Button onClick={handleRefineSummary} disabled={isCollaborating || isSuggesting || isRefining || !collaborationResult} size="sm" variant="outline">
                    {isRefining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.dashboard.refine_summary_loading[language]}</> : <><WandSparkles className="mr-2 h-4 w-4" />{t.dashboard.refine_summary_button[language]}</>}
                </Button>
              </h3>
               <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText />{t.dashboard.summary_title[language]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{collaborationResult.executiveSummary}</p>
                    </CardContent>
                  </Card>
                   
                   {isRefining && 
                    <div className="flex items-center justify-center text-muted-foreground p-8">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.dashboard.refine_summary_loading[language]}
                    </div>
                   }

                   {refinedSummary && critiqueResult && (
                      <div className="border-t-2 border-dashed border-primary/50 pt-6 mt-6 space-y-6 animate-fade-in">
                          <h4 className="font-headline text-lg">{t.dashboard.refinement_dialog_title[language]}</h4>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              <Card>
                                  <CardHeader><CardTitle className="text-base">{t.dashboard.original_version[language]}</CardTitle></CardHeader>
                                  <CardContent className="text-sm text-muted-foreground"><p>{collaborationResult.executiveSummary}</p></CardContent>
                              </Card>
                              <Card className="bg-primary/5 border-primary">
                                  <CardHeader><CardTitle className="text-base">{t.dashboard.refined_version[language]}</CardTitle></CardHeader>
                                  <CardContent className="text-sm font-medium"><p>{refinedSummary}</p></CardContent>
                              </Card>
                          </div>
                          
                          <Accordion type="multiple" className="w-full">
                              <AccordionItem value="diff">
                                  <AccordionTrigger>{t.dashboard.diff_view[language]}</AccordionTrigger>
                                  <AccordionContent>
                                      <Card><CardContent className="p-4"><DiffView string1={collaborationResult.executiveSummary} string2={refinedSummary} /></CardContent></Card>
                                  </AccordionContent>
                              </AccordionItem>
                              <AccordionItem value="critique">
                                  <AccordionTrigger>{t.dashboard.critique_analysis[language]}</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2 p-4 border rounded-lg bg-background/50">
                                      <CritiqueSection icon={Check} title={t.dashboard.strengths[language]} items={critiqueResult.strengths} color="text-green-500" />
                                      <CritiqueSection icon={AlertTriangle} title={t.dashboard.weaknesses[language]} items={critiqueResult.weaknesses} color="text-amber-500" />
                                      <CritiqueSection icon={Route} title={t.dashboard.implementation_challenges[language]} items={critiqueResult.implementationChallenges} color="text-red-500" />
                                      <CritiqueSection icon={Hammer} title={t.dashboard.unintended_consequences[language]} items={critiqueResult.unintendedConsequences} color="text-purple-500" />
                                      <CritiqueSection icon={Lightbulb} title={t.dashboard.recommendations[language]} items={critiqueResult.recommendations} color="text-blue-500" />
                                    </div>
                                  </AccordionContent>
                              </AccordionItem>
                          </Accordion>

                          <div className="flex justify-end gap-2">
                              <Button variant="ghost" onClick={handleDiscardRefinement}>{t.dashboard.keep_original_button[language]}</Button>
                              <Button onClick={handleAdoptRefinement}>{t.dashboard.adopt_refined_button[language]}</Button>
                          </div>
                      </div>
                    )}


                   <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BrainCircuit />{t.dashboard.reasoning_title[language]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground">{collaborationResult.reasoning}</p>
                    </CardContent>
                  </Card>
                  {collaborationResult.validationGrid && (
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
                   )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {collaborationResult.collaborationLog && collaborationResult.collaborationLog.length > 0 && (
                      <Card className="h-full flex flex-col">
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-lg font-headline"><MessageSquare />{t.dashboard.log_title_visible[language]}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="space-y-6 max-h-[700px] overflow-y-auto p-4 border rounded-lg bg-background/50 h-full">
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
                        </CardContent>
                      </Card>
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
          {isHydrated ? sortedAgents.map(agent => {
            const isOrchestrator = ORCHESTRATOR_IDS.includes(agent.id);
            return (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onPromptChange={handlePromptChange} 
                isSelected={isOrchestrator || selectedAgentIds.has(agent.id)}
                onSelectionChange={handleAgentSelectionChange}
                selectedModel={selectedModel}
                isOrchestrator={isOrchestrator}
              />
            )
          }) : Array.from({ length: 12 }).map((_, index) => (
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
