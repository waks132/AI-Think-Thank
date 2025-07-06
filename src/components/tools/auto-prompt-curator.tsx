"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { autoCuration, type AutoCurationOutput } from "@/ai/flows/auto-prompt-curator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Archive, ArchiveX, CheckSquare, Loader2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { useLanguage } from "@/context/language-context"
import { t } from "@/lib/i18n"
import { personaList } from "@/lib/personas"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import useLocalStorage from "@/hooks/use-local-storage"
import type { Agent, LogEntry } from "@/lib/types"

const formSchema = z.object({
  promptText: z.string().min(10, { message: "Prompt text must be at least 10 characters." }),
  promptId: z.string().min(1, { message: "Prompt ID is required." }),
  usageFrequency: z.coerce.number().min(0),
  successRate: z.coerce.number().min(0).max(1),
  averageRating: z.coerce.number().min(0).max(5).optional(),
  similarityToOtherPrompts: z.coerce.number().min(0).max(1).optional(),
})

export default function AutoPromptCurator() {
  const [result, setResult] = useLocalStorage<AutoCurationOutput | null>("auto-curator-result", null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(personaList[0].id);
  const { toast } = useToast()
  const { language } = useLanguage();
  const [storedAgents] = useLocalStorage<Agent[]>('agents', []);
  const [logs] = useLocalStorage<LogEntry[]>('cognitive-logs', []);
  const storedAgentMap = useMemo(() => new Map(storedAgents.map(a => [a.id, a])), [storedAgents]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptText: "",
      promptId: "",
      usageFrequency: 0,
      successRate: 0,
      averageRating: 0,
      similarityToOtherPrompts: 0,
    },
  })

  useEffect(() => {
    const selectedPersona = personaList.find(p => p.id === selectedAgentId);
    if (selectedPersona) {
      const storedAgent = storedAgentMap.get(selectedAgentId);
      const agentPrompt = storedAgent ? storedAgent.prompt : selectedPersona.values[language];
      
      form.setValue('promptText', agentPrompt);
      form.setValue('promptId', selectedPersona.id);

      // Calculate usage from real logs
      const usageFrequency = logs.filter(log => log.agentId === selectedAgentId).length;
      form.setValue('usageFrequency', usageFrequency);

      // Simulate other metrics based on usage to feel more connected
      const hasBeenUsed = usageFrequency > 0;
      // If used, simulate a higher success rate (50-90%). If unused, simulate a lower one (0-40%).
      const successRate = hasBeenUsed ? Math.round((Math.random() * 0.4 + 0.5) * 100) / 100 : Math.round((Math.random() * 0.4) * 100) / 100;
      // If used, simulate a higher average rating (3-5 stars). If unused, lower (1-3 stars).
      const averageRating = hasBeenUsed ? Math.round((Math.random() * 2 + 3) * 10) / 10 : Math.round((Math.random() * 2 + 1) * 10) / 10;
      
      form.setValue('successRate', successRate);
      form.setValue('averageRating', averageRating);
      
      // Similarity is independent of usage, so keep original simulation
      form.setValue('similarityToOtherPrompts', Math.round((Math.random() * 0.5) * 100) / 100);
    }
  }, [selectedAgentId, language, form, storedAgentMap, logs]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await autoCuration({...values, model: selectedModel, language})
      setResult(output)
    } catch (error) {
      console.error("Error during auto-curation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get curation recommendation. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const ResultIcon = () => {
    if (!result) return null;
    switch (result.actionRecommended) {
      case 'archive': return <Archive className="h-8 w-8 text-yellow-500" />;
      case 'suppress': return <ArchiveX className="h-8 w-8 text-red-500" />;
      case 'keep': return <CheckSquare className="h-8 w-8 text-green-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{t.curator.title[language]}</CardTitle>
        <CardDescription>{t.curator.description[language]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                
                <FormItem>
                  <Label>{t.curator.select_agent_label[language]}</Label>
                  <Select onValueChange={setSelectedAgentId} defaultValue={selectedAgentId}>
                    <SelectTrigger>
                        <SelectValue placeholder={t.curator.select_agent_placeholder[language]} />
                    </SelectTrigger>
                    <SelectContent>
                      {personaList.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name[language]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>

                <FormField
                  control={form.control}
                  name="promptText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.curator.prompt_text_readonly_label[language]}</FormLabel>
                      <FormControl>
                        <Textarea readOnly {...field} className="bg-muted/50 h-36" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="promptId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="usageFrequency" render={({ field }) => (<FormItem><FormLabel>{t.curator.usage_label[language]}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="successRate" render={({ field }) => (<FormItem><FormLabel>{t.curator.success_rate_label[language]}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="averageRating" render={({ field }) => (<FormItem><FormLabel>{t.curator.rating_label[language]}</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="similarityToOtherPrompts" render={({ field }) => (<FormItem><FormLabel>{t.curator.similarity_label[language]}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.curator.get_reco_button[language]}</> : t.curator.get_reco_button[language]}
                </Button>
              </form>
            </Form>
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-4 font-headline">{t.curator.recommendation_title[language]}</h3>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{t.curator.loading_text[language]}</p>
              </div>
            )}
            {result && (
              <div className="flex flex-col items-center justify-center h-full p-8 border rounded-lg bg-card animate-fade-in text-center">
                  <ResultIcon />
                  <Badge variant={result.actionRecommended === 'keep' ? 'default' : 'destructive'} className="my-4 capitalize text-lg py-1 px-4">
                    {t.curator.actions[result.actionRecommended][language]}
                  </Badge>
                  <p className="text-muted-foreground">{result.reason}</p>
              </div>
            )}
            {!isLoading && !result && (
              <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-center">{t.curator.no_results[language]}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
