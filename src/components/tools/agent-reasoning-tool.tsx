"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { agentReasoning, type AgentReasoningOutput } from "@/ai/flows/agent-reasoning"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Lightbulb, Loader2, CheckCircle2 } from 'lucide-react'
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  task: z.string().min(10, { message: "Task must be at least 10 characters." }),
  context: z.string().min(10, { message: "Context must be at least 10 characters." }),
})

export default function AgentReasoningTool() {
  const [result, setResult] = useState<AgentReasoningOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      task: "Plan a three-day trip to Mars for a new colonist.",
      context: "The colonist is a botanist. The budget is limited. The focus is on acclimatization and initial research setup.",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await agentReasoning(values)
      setResult(output)
    } catch (error) {
      console.error("Error getting reasoning:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get agent reasoning. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Agent Reasoning (Chain of Thought)</CardTitle>
        <CardDescription>See how an agent thinks step-by-step to arrive at a conclusion.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="task"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter the agent's task..." {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="context"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide context for the task..." {...field} rows={4}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...</>
                  ) : (
                    <><Lightbulb className="mr-2 h-4 w-4" /> Generate Reasoning</>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-4 font-headline">Agent's Thought Process</h3>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing task...</p>
              </div>
            )}
            {result && (
              <div className="space-y-4 animate-fade-in bg-card p-4 rounded-lg border">
                <div>
                    <h4 className="font-semibold flex items-center mb-2 text-primary">
                        <Lightbulb className="mr-2 h-5 w-5"/>
                        Reasoning Steps
                    </h4>
                    <p className="whitespace-pre-wrap text-muted-foreground text-sm">{result.reasoning}</p>
                </div>
                <Separator />
                <div>
                    <h4 className="font-semibold flex items-center mb-2 text-secondary">
                        <CheckCircle2 className="mr-2 h-5 w-5"/>
                        Conclusion
                    </h4>
                    <p className="whitespace-pre-wrap font-medium">{result.conclusion}</p>
                </div>
              </div>
            )}
            {!isLoading && !result && (
              <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-center">The agent's reasoning will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
