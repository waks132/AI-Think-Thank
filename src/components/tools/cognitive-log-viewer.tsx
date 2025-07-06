"use client";

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useLocalStorage from '@/hooks/use-local-storage';
import type { LogEntry } from '@/lib/types';
import { Compass, Shield, ClipboardCheck, BrainCircuit } from 'lucide-react';

const initialLogs: LogEntry[] = [
  {
    id: 'log1',
    agentId: 'kairos-1',
    agentRole: 'KAIROS-1',
    message: 'Initial objective set: Model the emergence of collective intelligence in a decentralized network.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'log2',
    agentId: 'obsidienne',
    agentRole: 'OBSIDIANNE',
    message: 'The term "intelligence" itself is a loaded assumption. Are we measuring task completion efficiency or genuine synergistic insight? The distinction is critical.',
    annotation: 'OBSIDIANNE questions premise',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 'log3',
    agentId: 'veritas',
    agentRole: 'VERITAS',
    message: 'Correction: The initial prompt for the simulation nodes lacked a mechanism for resource conflict, making true "collective" problem-solving impossible. The logic is flawed.',
    annotation: 'VERITAS corrected KAIROS-1',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

const agentIcons: { [key: string]: React.ElementType } = {
  'KAIROS-1': Compass,
  'OBSIDIANNE': Shield,
  'VERITAS': ClipboardCheck,
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
