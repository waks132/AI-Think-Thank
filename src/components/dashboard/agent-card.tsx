"use client";

import { useState } from 'react';
import type { Agent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { History, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import type { PromptVersion } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
  onPromptChange: (agentId: string, newPrompt: string) => void;
  isSelected: boolean;
  onSelectionChange: (agentId: string, isSelected: boolean) => void;
}

export default function AgentCard({ agent, onPromptChange, isSelected, onSelectionChange }: AgentCardProps) {
  const [prompt, setPrompt] = useState(agent.prompt);
  const [promptHistory, setPromptHistory] = useLocalStorage<PromptVersion[]>(`prompt-history-${agent.id}`, []);
  const { toast } = useToast();

  const handleSave = () => {
    onPromptChange(agent.id, prompt);
    const newVersion: PromptVersion = {
      id: new Date().toISOString(),
      prompt: prompt,
      timestamp: new Date().toISOString(),
    };
    setPromptHistory(prevHistory => [newVersion, ...prevHistory].slice(0, 20)); // Keep last 20 versions
    toast({
      title: 'Prompt Saved',
      description: `Prompt for ${agent.role} has been updated.`,
    });
  };

  return (
    <Card className={cn("flex flex-col h-full transition-all duration-300 hover:shadow-xl", isSelected && "ring-2 ring-primary")}>
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-accent rounded-lg">
            <agent.icon className="h-6 w-6 text-accent-foreground" />
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
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid w-full gap-1.5 h-full">
          <Label htmlFor={`prompt-${agent.id}`}>Prompt</Label>
          <Textarea
            id={`prompt-${agent.id}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[150px] flex-grow"
            placeholder={`Enter prompt for ${agent.role}...`}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled>
          <History className="mr-2 h-4 w-4" />
          Lineage
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
