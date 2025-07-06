"use client";

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useLocalStorage from '@/hooks/use-local-storage';
import type { LogEntry } from '@/lib/types';
import { BrainCircuit, Lightbulb, ClipboardCheck } from 'lucide-react';

const initialLogs: LogEntry[] = [
  {
    id: 'log1',
    agentId: 'analyst',
    agentRole: 'Analyst',
    message: 'Initial data suggests a 15% drop in user engagement for the new feature.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'log2',
    agentId: 'creative',
    agentRole: 'Creative',
    message: 'What if we gamify the feature with a points system to boost engagement?',
    annotation: 'New hypothesis introduced',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 'log3',
    agentId: 'fact_checker',
    agentRole: 'Fact-Checker',
    message: 'Correction: The engagement drop is actually 12%, not 15%, based on the finalized dataset.',
    annotation: 'Agent Fact-Checker corrected Agent Analyst',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

const agentIcons: { [key: string]: React.ElementType } = {
  Analyst: BrainCircuit,
  Creative: Lightbulb,
  'Fact-Checker': ClipboardCheck,
};

export default function CognitiveLogViewer() {
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('cognitive-logs', []);
  
  useEffect(() => {
    // On first load, if logs are empty, populate with initial data.
    if (logs.length === 0) {
      setLogs(initialLogs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Annotated Cognitive Log Viewer</CardTitle>
        <CardDescription>
          View journaled conversations with automatic annotations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-h-[600px] overflow-y-auto p-4 border rounded-lg bg-background/50">
          {logs.map((log) => {
            const Icon = agentIcons[log.agentRole] || BrainCircuit;
            return (
              <div key={log.id} className="flex items-start gap-4 animate-fade-in">
                <div className="p-2 bg-accent rounded-full">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-primary">{log.agentRole}</p>
                    <time className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </time>
                  </div>
                  <p className="text-sm text-foreground/90">{log.message}</p>
                  {log.annotation && (
                    <p className="mt-1 text-xs text-secondary font-medium italic">
                      -- {log.annotation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
           {logs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No log entries found.</p>
            </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
