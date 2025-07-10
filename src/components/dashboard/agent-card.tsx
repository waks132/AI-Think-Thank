"use client";

import { useState, useEffect } from 'react';
import type { Agent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, WandSparkles, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { adaptivePromptRewriter, type AdaptivePromptRewriterOutput } from '@/ai/flows/adaptive-prompt-rewriter';
import { Badge } from '../ui/badge';
import { useLanguage } from '@/context/language-context';
import { t } from '@/lib/i18n';
import { ORCHESTRATOR_IDS, personaMap } from '@/lib/personas';

interface AgentCardProps {
  agent: Agent;
  onPromptChange: (agentId: string, newPrompt: string, refinementResult?: AdaptivePromptRewriterOutput) => void;
  isSelected: boolean;
  onSelectionChange: (agentId: string, isSelected: boolean) => void;
  selectedModel: string;
  isOrchestrator: boolean;
  orchestratorContext?: string;
}

function AgentCard({ agent, onPromptChange, isSelected, onSelectionChange, selectedModel, isOrchestrator, orchestratorContext }: AgentCardProps) {
  const [currentPrompt, setCurrentPrompt] = useState(agent.prompt);
  const [isRefining, setIsRefining] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const persona = personaMap.get(agent.id);
  const Icon = persona?.Icon || BrainCircuit;

  useEffect(() => {
    setCurrentPrompt(agent.prompt);
  }, [agent.prompt]);

  const handleSave = () => {
    onPromptChange(agent.id, currentPrompt);
    toast({
      title: t.agentCard.toast_save_title[language],
      description: t.agentCard.toast_save_description[language].replace('{agentRole}', agent.role),
    });
  };

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const result = await adaptivePromptRewriter({
        originalPrompt: currentPrompt,
        agentRole: agent.role,
        agentSpecialization: agent.specialization,
        agentPerformance: "The current prompt could be clearer, more specific, and provide more actionable guidance to fulfill its role effectively. It should be refined for better performance.",
        model: selectedModel,
        language: language,
        orchestratorContext: orchestratorContext,
      });

      if (result) {
        const { rewrittenPrompt, psiScore } = result;
        setCurrentPrompt(rewrittenPrompt); // Update local text area immediately for responsiveness
        onPromptChange(agent.id, rewrittenPrompt, result); // Pass the entire result up
        
        toast({
          title: t.agentCard.toast_refine_title[language],
          description: `${t.agentCard.toast_refine_description[language]}: ${(psiScore * 100).toFixed(0)}/100`,
        });
      }
    } catch (error) {
      console.error("Error refining prompt:", error);
      toast({
        variant: "destructive",
        title: t.agentCard.toast_refine_fail_title[language],
        description: t.agentCard.toast_refine_fail_description[language],
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isOrchestrator) {
      setCurrentPrompt(e.target.value);
    }
  }

  return (
    <Card className={cn("flex flex-col h-full transition-all duration-300 hover:shadow-xl", isSelected && !isOrchestrator && "ring-2 ring-primary", isOrchestrator && "bg-muted/30")}>
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-accent rounded-lg">
            {Icon && <Icon className="h-6 w-6 text-accent-foreground" />}
          </div>
          {!isOrchestrator && (
            <Checkbox 
              id={`select-${agent.id}`}
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange(agent.id, !!checked)}
              aria-label={`Select ${agent.role}`}
            />
          )}
        </div>
        <div>
          <CardTitle className="font-headline flex items-center gap-2">
            {agent.role}
            {isOrchestrator && <Badge variant="secondary">{t.agentCard.orchestrator_badge[language]}</Badge>}
          </CardTitle>
          <CardDescription>{agent.specialization}</CardDescription>
          {agent.lastPsiScore !== null && agent.lastPsiScore !== undefined && (
            <Badge variant="secondary" className="mt-2 animate-fade-in">
              {t.agentCard.psi_score[language]}: {(agent.lastPsiScore * 100).toFixed(0)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid w-full gap-1.5 h-full">
          <Label htmlFor={`prompt-${agent.id}`}>{t.agentCard.prompt_label[language]}</Label>
          <Textarea
            id={`prompt-${agent.id}`}
            value={currentPrompt}
            onChange={handleTextChange}
            className={cn("flex-grow", isOrchestrator ? "min-h-[300px]" : "min-h-[150px]")}
            placeholder={`${t.agentCard.placeholder[language]} ${agent.role}...`}
            readOnly={isOrchestrator}
            disabled={isOrchestrator}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleRefine} disabled={isRefining || isOrchestrator}>
          {isRefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
          {t.agentCard.refine_button[language]}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isOrchestrator}>
          <Save className="mr-2 h-4 w-4" />
          {t.agentCard.save_button[language]}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AgentCard;
