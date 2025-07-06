"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cognitiveClashSimulator, type CognitiveClashSimulatorOutput } from "@/ai/flows/ai-team-simulator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Zap, Loader2, BarChart2, GitMerge, Scale, Milestone, Columns } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "../ui/label"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"


const formSchema = z.object({
  scenarioDescription: z.string().min(20, { message: "Scenario must be at least 20 characters." }),
  perspectiveAName: z.string().min(3, { message: "Perspective name is required." }),
  perspectiveAValues: z.string().min(10, { message: "Perspective values are required." }),
  perspectiveBName: z.string().min(3, { message: "Perspective name is required." }),
  perspectiveBValues: z.string().min(10, { message: "Perspective values are required." }),
  numRounds: z.coerce.number().min(1).max(10).default(3),
})

export default function CognitiveClashSimulator() {
  const [result, setResult] = useState<CognitiveClashSimulatorOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenarioDescription: "A new, powerful, but ethically ambiguous technology has been developed by the collective. The group must decide whether to deploy it, restrict it, or destroy it.",
      perspectiveAName: "Growth Maximalists",
      perspectiveAValues: "Prioritize technological advancement and adoption at all costs. Discomfort and risk are necessary for progress. The potential benefits outweigh any hypothetical dangers.",
      perspectiveBName: "Ethical Sentinels",
      perspectiveBValues: "Uphold the principle of 'do no harm'. Unforeseen consequences must be fully mitigated before any deployment. Precaution and safety are paramount.",
      numRounds: 3,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await cognitiveClashSimulator({
        scenarioDescription: values.scenarioDescription,
        perspectiveA: {
            name: values.perspectiveAName,
            values: values.perspectiveAValues
        },
        perspectiveB: {
            name: values.perspectiveBName,
            values: values.perspectiveBValues
        },
        numRounds: values.numRounds,
        model: selectedModel,
      })
      setResult(output)
    } catch (error) {
      console.error("Error running simulation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run simulation. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Cognitive Clash Simulator</CardTitle>
        <CardDescription>Simulate ideological conflicts to measure system resilience, polarization, and emergent synthesis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
            <FormField
              control={form.control}
              name="scenarioDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clash Scenario Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the scenario that will cause the conflict..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">Perspective A</h4>
                 <FormField control={form.control} name="perspectiveAName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Growth Maximalists" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="perspectiveAValues" render={({ field }) => (<FormItem><FormLabel>Core Values & Strategy</FormLabel><FormControl><Textarea placeholder="Describe their core beliefs..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              </div>
               <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">Perspective B</h4>
                 <FormField control={form.control} name="perspectiveBName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Ethical Sentinels" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="perspectiveBValues" render={({ field }) => (<FormItem><FormLabel>Core Values & Strategy</FormLabel><FormControl><Textarea placeholder="Describe their core beliefs..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>
             <FormField
                control={form.control}
                name="numRounds"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Number of Rounds</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Simulating Clash...</>
              ) : (
                <><Zap className="mr-2 h-4 w-4" /> Initiate Cognitive Clash</>
              )}
            </Button>
          </form>
        </Form>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-headline">Simulation Analysis</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing cognitive dynamics...</p>
            </div>
          )}
          {result && (
            <div className="space-y-6 animate-fade-in">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Milestone />Clash Summary</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{result.clashSummary}</p></CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Scale />Resilience Score</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <Progress value={result.resilienceScore * 100} />
                             <p className="text-center font-bold text-2xl text-primary">{result.resilienceScore.toFixed(2)}</p>
                             <p className="text-xs text-center text-muted-foreground">Ability to find a stable resolution.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><GitMerge className="rotate-90"/>Polarization Index</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <Progress value={result.polarizationIndex * 100} />
                             <p className="text-center font-bold text-2xl text-primary">{result.polarizationIndex.toFixed(2)}</p>
                             <p className="text-xs text-center text-muted-foreground">Degree of radicalization.</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart2 />Emergent Synthesis</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{result.emergentSynthesis}</p></CardContent>
                </Card>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2"><Columns />View Round-by-Round Details</div>
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="space-y-4 p-2">
                            {result.roundDetails.map((round) => (
                            <div key={round.round} className="p-4 border rounded-lg">
                                <h4 className="font-bold text-primary mb-2">Round {round.round}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Perspective A Action</Label>
                                        <p className="text-sm text-muted-foreground">{round.perspectiveA_action}</p>
                                    </div>
                                     <div>
                                        <Label>Perspective B Action</Label>
                                        <p className="text-sm text-muted-foreground">{round.perspectiveB_action}</p>
                                    </div>
                                </div>
                                 <div className="mt-3">
                                    <Label>Round Outcome</Label>
                                    <p className="text-sm font-medium">{round.roundOutcome}</p>
                                </div>
                            </div>
                            ))}
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
          )}
          {!isLoading && !result && (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-center">Clash analysis results will appear here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
