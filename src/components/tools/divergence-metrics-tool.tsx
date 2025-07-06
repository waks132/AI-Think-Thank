"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { calculatePromptDivergence, type CalculatePromptDivergenceOutput } from "@/ai/flows/prompt-divergence-metrics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Scale, Loader2, Info } from 'lucide-react'
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { Progress } from "../ui/progress"
const Diff = require('diff');

const formSchema = z.object({
  promptVersionA: z.string().min(10, { message: "Prompt A must be at least 10 characters." }),
  promptVersionB: z.string().min(10, { message: "Prompt B must be at least 10 characters." }),
})

const DiffView = ({ string1, string2 }: { string1: string; string2: string }) => {
    const differences = Diff.diffWords(string1, string2);
    return (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {differences.map((part: any, index: number) => {
                const style = part.added ? 'bg-green-500/20 text-green-200' 
                            : part.removed ? 'bg-red-500/20 text-red-200' 
                            : 'text-muted-foreground';
                return <span key={index} className={`${style} transition-colors duration-300 p-0.5 rounded-sm`}>{part.value}</span>
            })}
        </pre>
    );
};


export default function DivergenceMetricsTool() {
  const [result, setResult] = useState<CalculatePromptDivergenceOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptVersionA: "Describe the water cycle in detail.",
      promptVersionB: "Explain the process of the water cycle for a fifth-grade student.",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await calculatePromptDivergence({...values, model: selectedModel})
      setResult(output)
    } catch (error) {
      console.error("Error calculating divergence:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to calculate divergence. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Prompt Divergence Metrics</CardTitle>
        <CardDescription>Calculate the semantic and intentional divergence between two prompt versions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="promptVersionA" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Version A</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the first prompt version..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="promptVersionB" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Version B</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the second prompt version..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="animate-spin" /> Calculating...</> : <><Scale/> Calculate Divergence</>}
            </Button>
          </form>
        </Form>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold font-headline mb-4">Analysis Result</h3>
           <div className="p-6 border-2 border-dashed rounded-lg bg-card min-h-48 flex flex-col justify-center">
              {isLoading ? (
                <div className="flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                  <p>Analyzing prompts...</p>
                </div>
              ) : result ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="lg:col-span-1 space-y-4">
                        <h4 className="font-semibold text-center">Divergence Score</h4>
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-5xl font-bold text-primary">{result.divergenceScore.toFixed(2)}</p>
                            <Progress value={result.divergenceScore * 100} className="w-full h-2"/>
                            <p className="text-xs text-muted-foreground mt-1">0 = Identical, 1 = Unrelated</p>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Info /> Explanation</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.explanation}</p>
                    </div>
                    <div className="lg:col-span-3">
                         <h4 className="font-semibold mt-4">Diff View</h4>
                         <Card className="mt-2">
                            <CardContent className="p-4 max-h-60 overflow-y-auto">
                                <DiffView string1={form.getValues("promptVersionA")} string2={form.getValues("promptVersionB")} />
                            </CardContent>
                         </Card>
                    </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">Divergence analysis will appear here.</p>
              )}
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
