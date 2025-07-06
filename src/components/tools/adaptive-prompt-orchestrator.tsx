"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { adaptivePromptRewriter, type AdaptivePromptRewriterOutput } from "@/ai/flows/adaptive-prompt-rewriter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { WandSparkles, Loader2, Lightbulb } from 'lucide-react'
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  originalPrompt: z.string().min(10, { message: "Original prompt must be at least 10 characters." }),
  agentPerformance: z.string().min(10, { message: "Agent performance description must be at least 10 characters." }),
  metricsDivergence: z.coerce.number().optional(),
})

export default function AdaptivePromptOrchestrator() {
  const [result, setResult] = useState<AdaptivePromptRewriterOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalPrompt: "",
      agentPerformance: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await adaptivePromptRewriter(values)
      setResult(output)
    } catch (error) {
      console.error("Error rewriting prompt:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to rewrite the prompt. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Adaptive Prompt Orchestrator</CardTitle>
        <CardDescription>Adaptively rewrite prompts based on agent performance and lacunae.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="originalPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Prompt</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter the prompt that needs improvement..." {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agentPerformance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Performance Lacunae</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the agent's performance issues, e.g., 'Lacks factual accuracy on historical dates' or 'Output is too redundant'." {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metricsDivergence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metrics Divergence (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 0.42" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <WandSparkles className="mr-2 h-4 w-4" />
                      Rewrite Prompt
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-4 font-headline">Result</h3>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">AI is thinking...</p>
              </div>
            )}
            {result && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <WandSparkles className="text-primary h-5 w-5" />
                      Rewritten Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{result.rewrittenPrompt}</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Lightbulb className="text-amber-500 h-5 w-5" />
                       Reasoning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="whitespace-pre-wrap text-muted-foreground">{result.reasoning}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {!isLoading && !result && (
              <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-center">The rewritten prompt and reasoning will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
