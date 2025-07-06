"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Loader2, RefreshCw } from "lucide-react"
import type { CausalLink, LogEntry } from "@/lib/types";
import { trackCausalFlow } from "@/ai/flows/causal-flow-tracker-flow";
import { Button } from "../ui/button";
import useLocalStorage from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { availableModels } from "@/lib/models";
import ModelSelector from "../model-selector";
import { useLanguage } from "@/context/language-context";
import { t } from "@/lib/i18n";
import { personaList } from "@/lib/personas";
import { Badge } from "../ui/badge";

const AgentNode = ({ role, language }: { role: string, language: 'fr' | 'en' }) => {
    const agentData = useMemo(() => personaList.find(p => p.name[language] === role || p.name['fr'] === role || p.name['en'] === role), [role, language]);
    const Icon = agentData?.icon || ArrowRight;
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm min-w-[220px] justify-start">
            <div className="p-2 bg-accent rounded-full">
                <Icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-medium text-primary">{role}</span>
        </div>
    )
};

export default function CausalFlowTracker() {
    const [logs] = useLocalStorage<LogEntry[]>('cognitive-logs', []);
    const [flows, setFlows] = useLocalStorage<CausalLink[]>('causal-flow-result', []);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(availableModels[0]);
    const { toast } = useToast();
    const { language } = useLanguage();

    const analyzeFlow = async () => {
        if (logs.length === 0) {
            toast({
                variant: 'destructive',
                title: t.causal.toast_no_logs_title[language],
                description: t.causal.toast_no_logs_description[language],
            });
            return;
        }

        setIsLoading(true);
        setFlows([]);
        try {
            const result = await trackCausalFlow({
                logEntries: JSON.stringify(logs.map((log, index) => ({...log, index}))), // Add index for the AI
                model: selectedModel,
                language,
            });
            setFlows(result.causalFlows);
        } catch (error) {
            console.error("Error tracking causal flow:", error);
            toast({
                variant: "destructive",
                title: t.causal.toast_fail_title[language],
                description: t.causal.toast_fail_description[language],
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(logs.length > 0) {
            analyzeFlow();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{t.causal.title[language]}</CardTitle>
        <CardDescription>{t.causal.description[language]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} className="flex-grow"/>
            <Button onClick={analyzeFlow} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2"/>}
                {t.causal.analyze_button[language]}
            </Button>
        </div>
        <div className="flex justify-center items-center min-h-[400px] w-full border-2 border-dashed rounded-lg p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <p>{t.causal.loading_text[language]}</p>
            </div>
          ) : flows.length > 0 ? (
            <div className="w-full max-w-4xl space-y-8">
              {flows.map((flow, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <AgentNode role={flow.from} language={language} />
                  <div className="flex flex-col items-center text-center w-full md:w-auto">
                    <Badge variant="secondary" className="mb-2">{flow.reason}</Badge>
                    <ArrowRight className="h-8 w-8 text-primary/50 my-2 rotate-90 md:rotate-0" />
                    <blockquote className="text-xs italic text-muted-foreground border-l-2 pl-2 my-2 max-w-xs">
                        "{flow.influentialQuote}"
                    </blockquote>
                    <span className="text-xs font-mono text-muted-foreground">{t.causal.turn[language]} {flow.turn}</span>
                  </div>
                  <AgentNode role={flow.to} language={language} />
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-muted-foreground">
                <p>{t.causal.no_links[language]}</p>
                <p className="text-sm">{t.causal.re_analyze[language]}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
