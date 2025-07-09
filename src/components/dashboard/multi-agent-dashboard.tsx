"use client"

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, Loader2, Sparkles, FileText, BrainCircuit, ShieldCheck, MessageSquare, WandSparkles, Check, AlertTriangle, Route, Hammer, Lightbulb, CheckCircle } from 'lucide-react';
import AgentCard from './agent-card';
import type { Agent, AgentContribution, LogEntry, PromptVersion } from '@/lib/types';
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
  const [selectedAgentIds, setSelectedAgentIds] = useState(new Set<string>());
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('cognitive-logs', []);
  const [promptHistories, setPromptHistories] = useLocalStorage<Record<string, PromptVersion[]>>('prompt-histories', {});
  const [mission, setMission] = useLocalStorage<string>('mission-text', 'Développer un cadre pour le déploiement éthique de l\'IA dans les véhicules autonomes.');
  const [collaborationResult, setCollaborationResult] = useLocalStorage<AgentCollaborationOutput | null>("collaboration-result", null);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [critiqueResult, setCritiqueResult] = useState<StrategicSynthesisCritiqueOutput | null>(null);
  const [refinedSummary, setRefinedSummary] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const [contributionAnalysis, setContributionAnalysis] = useLocalStorage<{ participating: string[], missing: string[] } | null>("contribution-analysis", null);
  const { toast } = useToast();

  const agentIconMap = useMemo(() => {
    const map = new Map<string, React.ElementType>();
    personaList.forEach(p => {
      map.set(p.id, p.icon);
    });
    return map;
  }, []);
  
  const allAvailableAgentsForFlow = useMemo(() => agents.map(a => ({
      id: a.id,
      role: a.role,
      specialization: a.specialization,
  })), [agents]);

  const orchestratorContext = useMemo(() => {
    if (!agents || agents.length === 0) return undefined;
    return agents
      .filter(agent => ORCHESTRATOR_IDS.includes(agent.id))
      .map(agent => `Core Directive: ${agent.role}, Core Directive: "${agent.prompt}"`)
      .join(' | ');
  }, [agents]);

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
    setContributionAnalysis(null);

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
      
      if (result.agentContributions) {
        const missionStartTime = new Date();
        const newLogEntries: LogEntry[] = result.agentContributions.map((contrib, index) => ({
          id: `${missionStartTime.toISOString()}-${contrib.agentId}-${index}`,
          agentId: contrib.agentId,
          agentRole: contrib.agentRole,
          message: contrib.keyContribution,
          annotation: contrib.contributionType,
          timestamp: new Date(missionStartTime.getTime() + (index * 1000)).toISOString(),
        }));
        
        const updatedLogs = [...newLogEntries, ...logs];
        setLogs(updatedLogs);
        
        toast({
          title: t.dashboard.toast_log_title[language],
          description: t.dashboard.toast_log_description[language],
        });

        const expectedAgentIds = new Set(finalSelectedIds);
        const contributingAgentIds = new Set(result.agentContributions.map(log => log.agentId));
        
        const missingAgentIds = [...expectedAgentIds].filter(id => !contributingAgentIds.has(id) && !ORCHESTRATOR_IDS.includes(id));
        const participatingAgentRoles = [...contributingAgentIds]
            .map(id => agents.find(a => a.id === id)?.role || id)
            .filter(role => role !== 'KAIROS-1' && role !== 'PoliSynth Disruptor');

        const missingAgentRoles = missingAgentIds.map(id => agents.find(a => a.id === id)?.role || id);

        setContributionAnalysis({
            participating: participatingAgentRoles,
            missing: missingAgentRoles,
        });
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
          
          const finalSelectedIds = new Set(selectedAgentIds);
          const orchestratorsInRoster = agents.filter(a => ORCHESTRATOR_IDS.includes(a.id));
          orchestratorsInRoster.forEach(o => finalSelectedIds.add(o.id));

          const agentContextString = agents
            .filter(agent => finalSelectedIds.has(agent.id))
            .map(agent => `- **Agent ID:** ${agent.id}\n  - **Agent Role:** ${agent.role}\n  - **Core Directive:** "${agent.prompt}"`)
            .join('\n\n');

          const refinement = await adaptivePromptRewriter({
              originalPrompt: collaborationResult.executiveSummary,
              agentPerformance: performanceLacunae,
              orchestratorContext: agentContextString,
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
    // This effect handles hydration and resets prompts and lineage to default values.
    const defaultAgents = personaList.map(persona => ({
      id: persona.id,
      role: persona.name[language],
      specialization: persona.specialization[language],
      prompt: persona.values[language], // Always use the default prompt
      icon: persona.icon,
      lastPsiScore: null, // Also reset the score
    }));
    
    setAgents(defaultAgents);
    setPromptHistories({}); // Clears the lineage history

    toast({
        title: t.dashboard.toast_reset_title[language],
        description: t.dashboard.toast_reset_description[language],
    });

    setIsHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, setAgents, setPromptHistories]);


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

              {contributionAnalysis && (
                <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            {t.dashboard.analysis_title[language]}
                        </CardTitle>
                        <CardDescription>
                            {t.dashboard.analysis_description[language]}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {contributionAnalysis.missing.length > 0 ? (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t.dashboard.incomplete_contribution_title[language].replace('{count}', contributionAnalysis.missing.length.toString())}</AlertTitle>
                                <AlertDescription>
                                   <p className="mt-2">{t.dashboard.incomplete_contribution_description_p1[language]} <span className="font-semibold">{contributionAnalysis.missing.join(', ')}</span>.</p>
                                   <p className="mt-2 text-xs">{t.dashboard.incomplete_contribution_description_p2[language]}</p>
                                 </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="p-4 rounded-lg border bg-accent/50 flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-secondary" />
                                <div>
                                    <h4 className="font-semibold">{t.dashboard.full_contribution_title[language]}</h4>
                                    <p className="text-sm text-muted-foreground">{t.dashboard.full_contribution_description[language].replace('{count}', contributionAnalysis.participating.length.toString())}</p>
                                </div>
                            </div>
                        )}
                         <div className="mt-4">
                            <p className="font-semibold text-sm">{t.dashboard.contributing_agents[language].replace('{count}', contributionAnalysis.participating.length.toString())}</p>
                            <p className="text-sm text-muted-foreground">{contributionAnalysis.participating.length > 0 ? contributionAnalysis.participating.join(', ') : 'Aucun'}</p>
                        </div>
                    </CardContent>
                </Card>
              )}

              {collaborationResult?.conformityCheck && (
                <Card className="animate-fade-in mt-6" style={{ animationDelay: '300ms' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShieldCheck className="h-5 w-5" />
                      {t.dashboard.conformity_check_title[language]}
                    </CardTitle>
                    <CardDescription>
                      {t.dashboard.conformity_check_description[language]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-2">
                      {collaborationResult.conformityCheck.isCompliant ? (
                        <CheckCircle className="h-5 w-5 text-secondary" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-semibold">
                        {collaborationResult.conformityCheck.isCompliant
                          ? t.dashboard.conformity_compliant[language]
                          : t.dashboard.conformity_non_compliant[language]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t.dashboard.conformity_summary[language]}</h4>
                      <p className="text-muted-foreground">{collaborationResult.conformityCheck.summary}</p>
                    </div>
                    {collaborationResult.conformityCheck.realityCheckSummary && (
                      <div>
                        <h4 className="font-semibold mb-1">{t.dashboard.reality_check_summary[language]}</h4>
                        <p className="text-muted-foreground">{collaborationResult.conformityCheck.realityCheckSummary}</p>
                      </div>
                    )}
                     <div>
                      <h4 className="font-semibold mb-1">{t.dashboard.applied_methodologies[language]}</h4>
                      <div className="flex flex-wrap gap-2">
                        {collaborationResult.conformityCheck.appliedMethodologies.map(method => (
                          <Badge variant="outline" key={method}>{method}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t.dashboard.reports_consulted[language]}</h4>
                       <div className="flex flex-wrap gap-2">
                        {collaborationResult.conformityCheck.reportsConsulted.map(reportId => (
                          <Badge variant="outline" key={reportId} className="font-mono text-xs">{reportId}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {collaborationResult.agentContributions && collaborationResult.agentContributions.length > 0 && (
                      <Card className="h-full flex flex-col">
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-lg font-headline"><MessageSquare />{t.dashboard.key_contributions_title[language]}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="space-y-4 max-h-[700px] overflow-y-auto p-4 border rounded-lg bg-background/50 h-full">
                              {collaborationResult.agentContributions.map((contrib) => {
                                  const Icon = agentIconMap.get(contrib.agentId) || BrainCircuit;
                                  return (
                                      <div key={contrib.agentId} className="flex items-start gap-4 animate-fade-in">
                                          <div className="p-2 bg-accent rounded-full">
                                              <Icon className="h-5 w-5 text-accent-foreground" />
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex items-baseline justify-between">
                                                  <p className="font-semibold text-primary">{contrib.agentRole}</p>
                                                  <Badge variant="secondary" className="text-xs">{contrib.contributionType}</Badge>
                                              </div>
                                              <p className="text-sm text-foreground/90">{contrib.keyContribution}</p>
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
                orchestratorContext={orchestratorContext}
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
