"use client";

import { useState } from 'react';
import type { Agent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import type { PromptVersion } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { adaptivePromptRewriter } from '@/ai/flows/adaptive-prompt-rewriter';
import { Badge } from '../ui/badge';
import { useLanguage } from '@/context/language-context';
import { t } from '@/lib/i18n';

interface AgentCardProps {
  agent: Agent;
  onPromptChange: (agentId: string, newPrompt: string) => void;
  isSelected: boolean;
  onSelectionChange: (agentId: string, isSelected: boolean) => void;
  selectedModel: string;
}

export default function AgentCard({ agent, onPromptChange, isSelected, onSelectionChange, selectedModel }: AgentCardProps) {
  const [prompt, setPrompt] = useState(agent.prompt);
  const [promptHistory, setPromptHistory] = useLocalStorage<PromptVersion[]>(`prompt-history-${agent.id}`, []);
  const [isRefining, setIsRefining] = useState(false);
  const [lastPsiScore, setLastPsiScore] = useState<number | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const Icon = agent.icon;

  const handleSave = () => {
    onPromptChange(agent.id, prompt);
    const newVersion: PromptVersion = {
      id: new Date().toISOString(),
      prompt: prompt,
      timestamp: new Date().toISOString(),
    };
    setPromptHistory(prevHistory => [newVersion, ...prevHistory].slice(0, 20)); // Keep last 20 versions
    setLastPsiScore(null); // Reset score on manual save
    toast({
      title: t.agentCard.toast_save_title[language],
      description: t.agentCard.toast_save_description[language].replace('{agentRole}', agent.role),
    });
  };

  const handleRefine = async () => {
    setIsRefining(true);
    setLastPsiScore(null);
    try {
      const result = await adaptivePromptRewriter({
        originalPrompt: prompt,
        agentPerformance: "The current prompt could be clearer, more specific, and provide more actionable guidance to fulfill its role effectively. It should be refined for better performance.",
        model: selectedModel,
      });

      if (result) {
        const { rewrittenPrompt, psiScore } = result;
        setPrompt(rewrittenPrompt); // Update text area
        setLastPsiScore(psiScore); // Set score for display
        
        // Automatically save and trace the refined prompt
        onPromptChange(agent.id, rewrittenPrompt);
        const newVersion: PromptVersion = {
          id: new Date().toISOString(),
          prompt: rewrittenPrompt,
          timestamp: new Date().toISOString(),
        };
        setPromptHistory(prevHistory => [newVersion, ...prevHistory].slice(0, 20));
        
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


  return (
    <Card className={cn("flex flex-col h-full transition-all duration-300 hover:shadow-xl", isSelected && "ring-2 ring-primary")}>
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-accent rounded-lg">
            <Icon className="h-6 w-6 text-accent-foreground" />
          </div>
          <Checkbox 
            id={`select-${agent.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(agent.id, !!checked)}
            aria-label={`Select ${agent.role}`}
          />
        </div>
        <div>
          <CardTitle className="font-headline">{agent.role}</CardTitle>
          <CardDescription>{agent.specialization}</CardDescription>
          {lastPsiScore !== null && (
            <Badge variant="secondary" className="mt-2 animate-fade-in">
              {t.agentCard.psi_score[language]}: {(lastPsiScore * 100).toFixed(0)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid w-full gap-1.5 h-full">
          <Label htmlFor={`prompt-${agent.id}`}>{t.agentCard.prompt_label[language]}</Label>
          <Textarea
            id={`prompt-${agent.id}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[150px] flex-grow"
            placeholder={`${t.agentCard.placeholder[language]} ${agent.role}...`}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleRefine} disabled={isRefining}>
          {isRefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
          {t.agentCard.refine_button[language]}
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {t.agentCard.save_button[language]}
        </Button>
      </CardFooter>
    </Card>
  );
}

    