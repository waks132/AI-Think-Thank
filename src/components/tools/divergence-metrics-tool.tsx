"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { calculatePromptDivergence } from "@/ai/flows/prompt-divergence-metrics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Scale, Loader2 } from 'lucide-react'

const formSchema = z.object({
  promptVersionA: z.string().min(10, { message: "Prompt A must be at least 10 characters." }),
  promptVersionB: z.string().min(10, { message: "Prompt B must be at least 10 characters." }),
})

export default function DivergenceMetricsTool() {
  const [klDivergence, setKlDivergence] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
    setKlDivergence(null)
    try {
      const output = await calculatePromptDivergence(values)
      setKlDivergence(output.klDivergence)
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
        <CardDescription>Calculate the KL divergence between two prompt versions to quantify their difference.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="promptVersionA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Version A</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the first prompt version..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="promptVersionB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Version B</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the second prompt version..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : <><Scale className="mr-2 h-4 w-4" /> Calculate Divergence</>}
            </Button>
          </form>
        </Form>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold font-headline mb-2">Result</h3>
           <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg bg-card">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : klDivergence !== null ? (
                <div className="text-center animate-fade-in">
                  <p className="text-sm text-muted-foreground">Kullback-Leibler Divergence</p>
                  <p className="text-4xl font-bold text-primary">{klDivergence.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Higher value indicates greater divergence.</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Divergence score will appear here.</p>
              )}
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
