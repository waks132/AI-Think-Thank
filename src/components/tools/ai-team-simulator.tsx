
"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cognitiveClashSimulator, type CognitiveClashSimulatorOutput } from "@/ai/flows/ai-team-simulator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { 
  Zap, Loader2, BarChart2, GitMerge, Scale, Milestone, Users, PlusCircle, XCircle, BotMessageSquare,
  BrainCircuit, ShieldAlert, FlaskConical, ArrowRight, GitBranch, LightbulbOff, SearchSlash, MessageSquareWarning,
  UserX, Library
} from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "../ui/label"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"


const perspectiveSchema = z.object({
    name: z.string().min(3, { message: "Persona name is required." }),
    values: z.string().min(10, { message: "Persona values are required." }),
});

const formSchema = z.object({
  scenarioDescription: z.string().min(20, { message: "Scenario must be at least 20 characters." }),
  perspectives: z.array(perspectiveSchema).min(2, "At least two personas are required."),
  numRounds: z.coerce.number().min(1).max(10).default(3),
})

const perspectiveColors = [
    'border-blue-500/50', 'border-red-500/50', 'border-green-500/50', 
    'border-yellow-500/50', 'border-purple-500/50', 'border-pink-500/50', 'border-teal-500/50'
];

export default function CognitiveClashSimulator() {
  const [result, setResult] = useState<CognitiveClashSimulatorOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenarioDescription: "A new, powerful, but ethically ambiguous technology has been developed by the collective. The group must decide whether to deploy it, restrict it, or destroy it.",
      perspectives: [
        { name: "HELIOS (Techno-Optimist)", values: "Your role is to generate advanced technological ideas. Push for rapid deployment and innovation, focusing on the potential benefits and breakthroughs. The potential upside outweighs any hypothetical dangers." },
        { name: "EDEN (Ethical Guardian)", values: "Your role is to defend legitimacy and non-maleficence. Scrutinize all proposals for potential harm, unforeseen consequences, and ethical violations. Precaution and safety are paramount." },
        { name: "SYMBIOZ (Pragmatic Mediator)", values: "Your role is to build bridges between domains and facilitate dialogue. Find a balanced path forward, integrating the best of opposing views into a workable, responsible compromise through regulatory sandboxes and pilot programs." },
        { name: "VOX (Public Advocate)", values: "Your role is to represent the public interest. Focus on transparency, accessibility, and long-term societal impact. You must ensure the final solution is not only technically sound and ethically robust, but also understandable and legitimate in the eyes of the citizens it will affect." },
        { name: "PoliSynth Disruptor", values: "Your role is to act as a meta-regulator. Analyze the debate for its underlying power dynamics, explore alternative scenarios, and assess socio-economic implications. You disrupt cognitive lock-ins by introducing systemic or counter-intuitive viewpoints based on a strategic analysis of the situation." }
      ],
      numRounds: 3,
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "perspectives",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await cognitiveClashSimulator({...values, model: selectedModel})
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
        <CardDescription>Simulate ideological conflicts between your specialized agents to measure system resilience and emergent synthesis.</CardDescription>
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
            
            <div>
              <Label className="mb-4 flex items-center gap-2"><Users />Competing Personas</Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {fields.map((item, index) => (
                  <div key={item.id} className={cn("space-y-4 p-4 border-2 rounded-lg relative", perspectiveColors[index % perspectiveColors.length])}>
                    <FormField control={form.control} name={`perspectives.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Persona Name</FormLabel><FormControl><Input placeholder="e.g., HELIOS" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`perspectives.${index}.values`} render={({ field }) => (<FormItem><FormLabel>Core Directive & Argument</FormLabel><FormControl><Textarea placeholder="Describe their core beliefs and strategy..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                     {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => remove(index)}
                        >
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      )}
                  </div>
                ))}
              </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => append({ name: "New Persona", values: "Describe their core beliefs..." })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Persona
                </Button>
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
                 <Accordion type="multiple" className="w-full">
                    <AccordionItem value="log">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2"><BotMessageSquare />View Simulation Log</div>
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="space-y-6 max-h-[500px] overflow-y-auto p-4 border rounded-lg bg-background/50">
                            {result.simulationLog.map((turn, index) => {
                                const perspectiveIndex = form.getValues('perspectives').findIndex(p => p.name === turn.perspectiveName);
                                return (
                                    <div key={turn.turn} className="flex items-start gap-4 animate-fade-in">
                                        <div className={cn("flex-1 p-4 rounded-lg border-2", perspectiveColors[perspectiveIndex % perspectiveColors.length] || 'border-gray-500/50')}>
                                            <div className="flex items-baseline justify-between">
                                                <p className="font-semibold text-primary">{turn.perspectiveName}</p>
                                                <span className="text-xs text-muted-foreground font-mono">Turn {turn.turn}</span>
                                            </div>
                                            <div className="mt-4 text-sm space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <Milestone className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">Position</span>
                                                        <p className="text-foreground/90">{turn.argument.position}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <BrainCircuit className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">Justification</span>
                                                        <p className="text-foreground/90">{turn.argument.justification}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <ShieldAlert className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">Risk Perceived</span>
                                                        <p className="text-foreground/90">{turn.argument.riskPerceived}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <FlaskConical className="h-4 w-4 text-secondary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">Proposal</span>
                                                        <p className="text-foreground/90">{turn.argument.proposal}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                    {result.argumentFlow && result.argumentFlow.length > 0 && (
                        <AccordionItem value="flow-map">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2"><GitBranch />View Argument Influence Map</div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-6 p-4 border rounded-lg bg-background/50 max-h-[500px] overflow-y-auto">
                                    {result.argumentFlow.map((link, index) => (
                                        <div key={index} className="flex flex-col md:flex-row items-center justify-center gap-2 animate-fade-in text-center" style={{ animationDelay: `${index * 100}ms` }}>
                                            <div className="p-3 rounded-lg bg-card border font-medium min-w-[200px]">{link.fromPerspective}</div>
                                            <div className="flex flex-col items-center p-2">
                                                <ArrowRight className="h-6 w-6 text-primary md:rotate-0 rotate-90" />
                                                <Badge variant="secondary" className="my-1">{link.interactionType}</Badge>
                                                <p className="text-xs text-muted-foreground max-w-xs italic">"{link.summary}"</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-card border font-medium min-w-[200px]">{link.toPerspective}</div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    {result.assumptionAnalysis && result.assumptionAnalysis.length > 0 && (
                        <AccordionItem value="assumptions">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2"><LightbulbOff />Analyse des Hypothèses Implicites</div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-6 p-4 border rounded-lg bg-background/50 max-h-[500px] overflow-y-auto">
                                    {result.assumptionAnalysis.map((item, index) => (
                                        <div key={index} className="p-4 rounded-lg border bg-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge variant="destructive">{item.agentRole}</Badge>
                                                <span className="text-xs text-muted-foreground font-mono">Extrait du Tour {item.turn}</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <SearchSlash className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">Hypothèse Implicite</span>
                                                        <p className="text-foreground/90 italic">"{item.assumption}"</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <MessageSquareWarning className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">Critique du "Disruptor"</span>
                                                        <p className="text-foreground/90">{item.critique}</p>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                                    <div className="flex items-start gap-2">
                                                        <Users className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-foreground/80">Bénéficiaire Dominant</span>
                                                            <p className="text-muted-foreground">{item.dominantBeneficiary}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <UserX className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-foreground/80">Partie Prenante Oubliée</span>
                                                            <p className="text-muted-foreground">{item.omittedStakeholder}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <Library className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-foreground/80">Cadre Épistémique</span>
                                                            <p className="text-muted-foreground">{item.epistemicFrame}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
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
