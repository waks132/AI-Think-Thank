"use client"

import { useState } from "react"
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

const formSchema = z.object({
  promptText: z.string().min(10, { message: "Prompt text must be at least 10 characters." }),
  promptId: z.string().min(1, { message: "Prompt ID is required." }),
  usageFrequency: z.coerce.number().min(0),
  successRate: z.coerce.number().min(0).max(1),
  averageRating: z.coerce.number().min(0).max(5).optional(),
  similarityToOtherPrompts: z.coerce.number().min(0).max(1).optional(),
})

export default function AutoPromptCurator() {
  const [result, setResult] = useState<AutoCurationOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptText: "Generate a marketing slogan for a new coffee brand.",
      promptId: "prompt-1234",
      usageFrequency: 5,
      successRate: 0.2,
      averageRating: 1.5,
      similarityToOtherPrompts: 0.9,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await autoCuration({...values, model: selectedModel})
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
        <CardTitle className="font-headline text-2xl">Auto Prompt Curator</CardTitle>
        <CardDescription>Automatically get recommendations to suppress or archive unhelpful or redundant prompts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                <FormField
                  control={form.control}
                  name="promptText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Text</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter the prompt to evaluate..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="promptId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., prompt-123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="usageFrequency" render={({ field }) => (<FormItem><FormLabel>Usage Frequency</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="successRate" render={({ field }) => (<FormItem><FormLabel>Success Rate (0-1)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="averageRating" render={({ field }) => (<FormItem><FormLabel>Avg. Rating (0-5)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="similarityToOtherPrompts" render={({ field }) => (<FormItem><FormLabel>Similarity (0-1)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Get Recommendation"}
                </Button>
              </form>
            </Form>
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-4 font-headline">Recommendation</h3>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Curator is analyzing the data...</p>
              </div>
            )}
            {result && (
              <div className="flex flex-col items-center justify-center h-full p-8 border rounded-lg bg-card animate-fade-in text-center">
                  <ResultIcon />
                  <Badge variant={result.actionRecommended === 'keep' ? 'default' : 'destructive'} className="my-4 capitalize text-lg py-1 px-4">{result.actionRecommended}</Badge>
                  <p className="text-muted-foreground">{result.reason}</p>
              </div>
            )}
            {!isLoading && !result && (
              <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-center">Curation recommendation will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
