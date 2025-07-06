"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Loader2, RefreshCw } from "lucide-react"
import type { CausalLink, LogEntry, Agent } from "@/lib/types";
import { trackCausalFlow } from "@/ai/flows/causal-flow-tracker-flow";
import { Button } from "../ui/button";
import useLocalStorage from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { availableModels } from "@/ai/genkit";
import ModelSelector from "../model-selector";

const AGENT_DATA: Partial<Record<string, { color: string }>> = {
    'HELIOS': { color: 'bg-purple-500' },
    'VERITAS': { color: 'bg-green-500' },
    'SYMBIOZ': { color: 'bg-orange-500' },
    'VOX': { color: 'bg-blue-500' },
    'KAIROS-1': { color: 'bg-red-500' },
    'OBSIDIANNE': { color: 'bg-gray-500' },
};
  

const AgentNode = ({ role }: { role: string }) => {
    const agentData = AGENT_DATA[role] || { color: 'bg-indigo-500' };
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm min-w-[220px] justify-center">
            <div className={`h-3 w-3 rounded-full ${agentData.color}`} />
            <span className="font-medium">{role}</span>
        </div>
    )
};

export default function CausalFlowTracker() {
    const [logs] = useLocalStorage<LogEntry[]>('cognitive-logs', []);
    const [flows, setFlows] = useState<CausalLink[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(availableModels[0]);
    const { toast } = useToast();

    const analyzeFlow = async () => {
        if (logs.length === 0) {
            toast({
                variant: 'destructive',
                title: "No logs to analyze",
                description: "The cognitive log is empty.",
            });
            return;
        }

        setIsLoading(true);
        setFlows([]);
        try {
            const result = await trackCausalFlow({
                logEntries: JSON.stringify(logs),
                model: selectedModel,
            });
            setFlows(result.causalFlows);
        } catch (error) {
            console.error("Error tracking causal flow:", error);
            toast({
                variant: "destructive",
                title: "Analysis Failed",
                description: "Could not determine causal flow from logs.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        // Automatically analyze flow on initial load if logs are present
        if(logs.length > 0) {
            analyzeFlow();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Causal Flow Tracker</CardTitle>
        <CardDescription>
          Analysez les logs cognitifs pour visualiser dynamiquement comment les agents s'influencent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} className="flex-grow"/>
            <Button onClick={analyzeFlow} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Analyze Flow
            </Button>
        </div>
        <div className="flex justify-center items-center min-h-[400px] w-full border-2 border-dashed rounded-lg p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <p>Analyzing influence patterns...</p>
            </div>
          ) : flows.length > 0 ? (
            <div className="w-full max-w-2xl space-y-8">
              {flows.map((flow, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <AgentNode role={flow.from} />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-accent">{flow.reason}</span>
                    <ArrowRight className="h-8 w-8 text-primary/50 my-2 sm:my-0" />
                  </div>
                  <AgentNode role={flow.to} />
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-muted-foreground">
                <p>No causal links detected.</p>
                <p className="text-sm">Click "Analyze Flow" to process the latest logs.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
