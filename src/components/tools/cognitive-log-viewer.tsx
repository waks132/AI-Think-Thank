// @ts-nocheck
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useFirestore from '@/hooks/use-firestore';
import type { LogEntry } from '@/lib/types';
import { BrainCircuit } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { t } from '@/lib/i18n';
import { personaList } from '@/lib/personas';

export default function CognitiveLogViewer() {
  const sessionId = "default-session";
  const [logs] = useFirestore<LogEntry[]>(`sessions/${sessionId}/data`, 'cognitive-logs', []);
  const { language } = useLanguage();
  
  const agentIconMap = useMemo(() => {
    const map = new Map<string, React.ElementType>();
    personaList.forEach(p => {
      map.set(p.name.fr, p.icon);
      map.set(p.name.en, p.icon);
    });
    return map;
  }, []);

  const sortedLogs = useMemo(() => logs.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [logs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{t.logs.title[language]}</CardTitle>
        <CardDescription>{t.logs.description[language]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-h-[600px] overflow-y-auto p-4 border rounded-lg bg-background/50">
          {sortedLogs.map((log) => {
            const Icon = agentIconMap.get(log.agentRole) || BrainCircuit;
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
              <p>{t.logs.no_entries[language]}</p>
              <p className="text-sm">{t.logs.no_entries_tip[language]}</p>
            </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
