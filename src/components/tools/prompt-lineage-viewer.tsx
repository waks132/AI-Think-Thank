"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Agent, PromptVersion } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

const Diff = require('diff');

interface DiffViewProps {
  string1: string;
  string2: string;
}

const DiffView: React.FC<DiffViewProps> = ({ string1, string2 }) => {
    const differences = Diff.diffWords(string1, string2);
    return (
        <pre className="whitespace-pre-wrap text-sm">
            {differences.map((part: any, index: number) => {
                const color = part.added ? 'bg-green-500/20 text-green-200' : part.removed ? 'bg-red-500/20 text-red-200' : 'text-muted-foreground';
                return <span key={index} className={`${color} transition-colors duration-300`}>{part.value}</span>
            })}
        </pre>
    );
};


export default function PromptLineageViewer() {
  const [agents] = useLocalStorage<Agent[]>('agents', []);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [promptHistory] = useLocalStorage<PromptVersion[]>(selectedAgentId ? `prompt-history-${selectedAgentId}` : '', []);
  const [selectedVersion1, setSelectedVersion1] = useState<PromptVersion | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<PromptVersion | null>(null);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    setSelectedVersion1(null);
    setSelectedVersion2(null);
    const history = JSON.parse(localStorage.getItem(`prompt-history-${agentId}`) || '[]');
    if (history.length > 0) {
      setSelectedVersion1(history[0]);
    }
    if (history.length > 1) {
        setSelectedVersion2(history[1]);
    }
  };
  
  const handleVersionSelect = (version: PromptVersion) => {
    if (!selectedVersion1 || (selectedVersion1 && selectedVersion2)) {
        setSelectedVersion1(version);
        setSelectedVersion2(null);
    } else {
        // ensure v2 is older than v1
        if (new Date(version.timestamp) > new Date(selectedVersion1.timestamp)) {
            setSelectedVersion2(selectedVersion1);
            setSelectedVersion1(version);
        } else {
            setSelectedVersion2(version);
        }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Prompt Lineage Viewer</CardTitle>
        <CardDescription>
          Visualize the evolution of prompts. Compare versions and revert to stable ancestors.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
            <h3 className="font-semibold">Select Agent</h3>
            <Select onValueChange={handleAgentChange} defaultValue={selectedAgentId || undefined}>
                <SelectTrigger>
                    <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                    {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.role}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Separator />
            
            <h3 className="font-semibold">Versions</h3>
            <ScrollArea className="h-96 rounded-md border">
                <div className="p-4">
                {promptHistory.length > 0 ? (
                    <div className="space-y-2">
                    {promptHistory.map((version) => (
                        <button
                        key={version.id}
                        onClick={() => handleVersionSelect(version)}
                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            selectedVersion1?.id === version.id ? 'bg-primary text-primary-foreground' : 
                            selectedVersion2?.id === version.id ? 'bg-secondary text-secondary-foreground' : 
                            'hover:bg-accent'
                        }`}
                        >
                        <p className="font-medium">
                            {formatDistanceToNow(new Date(version.timestamp), { addSuffix: true })}
                        </p>
                        <p className="truncate text-xs opacity-70">{version.prompt}</p>
                        </button>
                    ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center">No history for this agent.</p>
                )}
                </div>
            </ScrollArea>
        </div>

        <div className="md:col-span-3">
            <h3 className="font-semibold mb-4">Comparison</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base">Version 1 {selectedVersion1 && `(${formatDistanceToNow(new Date(selectedVersion1.timestamp), { addSuffix: true })})`}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <Textarea readOnly value={selectedVersion1?.prompt || 'Select a version'} className="h-full bg-background" />
                    </CardContent>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base">Version 2 {selectedVersion2 && `(${formatDistanceToNow(new Date(selectedVersion2.timestamp), { addSuffix: true })})`}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <Textarea readOnly value={selectedVersion2?.prompt || 'Select a second version'} className="h-full bg-background" />
                    </CardContent>
                </Card>
            </div>
             {selectedVersion1 && selectedVersion2 && (
                <div className="mt-4">
                <h3 className="font-semibold mb-2">Diff View (Version 1 vs Version 2)</h3>
                <Card>
                    <CardContent className="p-4 h-[200px] overflow-y-auto">
                        <DiffView string1={selectedVersion2.prompt} string2={selectedVersion1.prompt} />
                    </CardContent>
                </Card>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
