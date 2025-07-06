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
import { WandSparkles, Loader2, Lightbulb, Sigma } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { useLanguage } from "@/context/language-context"
import { t } from "@/lib/i18n"

const formSchema = z.object({
  originalPrompt: z.string().min(10, { message: "Original prompt must be at least 10 characters." }),
  agentPerformance: z.string().min(10, { message: "Agent performance description must be at least 10 characters." }),
  metricsDivergence: z.coerce.number().optional(),
})

export default function AdaptivePromptOrchestrator() {
  const [result, setResult] = useState<AdaptivePromptRewriterOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast()
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalPrompt: "Your role is to coordinate and detect high-yield action levers.",
      agentPerformance: "The prompt is too abstract and lacks actionable examples, making it difficult for the agent to generate specific, testable outputs.",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await adaptivePromptRewriter({...values, model: selectedModel})
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
        <CardTitle className="font-headline text-2xl">{t.rewriter.title[language]}</CardTitle>
        <CardDescription>{t.rewriter.description[language]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                <FormField
                  control={form.control}
                  name="originalPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.rewriter.original_prompt_label[language]}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t.rewriter.original_prompt_placeholder[language]} {...field} rows={6} />
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
                      <FormLabel>{t.rewriter.performance_label[language]}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t.rewriter.performance_placeholder[language]} {...field} rows={6} />
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
                      <FormLabel>{t.rewriter.divergence_label[language]}</FormLabel>
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
                      {t.rewriter.rewrite_button_loading[language]}
                    </>
                  ) : (
                    <>
                      <WandSparkles className="mr-2 h-4 w-4" />
                      {t.rewriter.rewrite_button[language]}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-4 font-headline">{t.rewriter.result_title[language]}</h3>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{t.rewriter.loading_text[language]}</p>
              </div>
            )}
            {result && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <WandSparkles className="text-primary h-5 w-5" />
                      {t.rewriter.rewritten_prompt_title[language]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{result.rewrittenPrompt}</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Sigma className="text-secondary h-5 w-5" />
                       {t.rewriter.analysis_title[language]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="psi-score">{t.rewriter.psi_score_label[language]}</Label>
                      <div className="flex items-center gap-4 mt-1">
                        <Progress value={result.psiScore * 100} id="psi-score" className="flex-1" />
                        <span className="font-bold text-lg text-primary">{result.psiScore.toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <Label>{t.rewriter.traceability_label[language]}</Label>
                      <p className="text-xs text-muted-foreground mt-1 italic">{result.traceabilityNote}</p>
                    </div>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Lightbulb className="text-amber-500 h-5 w-5" />
                       {t.rewriter.reasoning_title[language]}
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
                <p className="text-muted-foreground text-center">{t.rewriter.no_results[language]}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

    