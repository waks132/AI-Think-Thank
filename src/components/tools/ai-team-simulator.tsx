"use client"

import { useState, useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cognitiveClashSimulator, type CognitiveClashSimulatorOutput } from "@/ai/flows/ai-team-simulator"
import { strategicSynthesisCritique, type StrategicSynthesisCritiqueOutput } from "@/ai/flows/strategic-synthesis-critique"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { 
  Zap, Loader2, BarChart2, GitMerge, Scale, Milestone, Users, PlusCircle, XCircle, BotMessageSquare,
  BrainCircuit, ShieldAlert, FlaskConical, ArrowRight, GitBranch, LightbulbOff, SearchSlash, MessageSquareWarning,
  UserX, Library, ShieldQuestion, Check, AlertTriangle, Route, Hammer, Lightbulb
} from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { useLanguage } from "@/context/language-context"
import { t } from "@/lib/i18n"
import { personaList } from "@/lib/personas"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import useLocalStorage from "@/hooks/use-local-storage"
import type { Agent } from "@/lib/types"


const perspectiveSchema = z.object({
  id: z.string().min(1, { message: "La sélection d'un persona est requise." }),
});

const formSchema = z.object({
  scenarioDescription: z.string().min(20, { message: "Le scénario doit comporter au moins 20 caractères." }),
  perspectives: z.array(perspectiveSchema).min(2, "Au moins deux personas sont requis."),
  numRounds: z.coerce.number().min(1).max(10).default(5),
})

const perspectiveColors = [
    'border-blue-500/50', 'border-red-500/50', 'border-green-500/50', 
    'border-yellow-500/50', 'border-purple-500/50', 'border-pink-500/50', 'border-teal-500/50'
];

export default function CognitiveClashSimulator() {
  const [result, setResult] = useLocalStorage<CognitiveClashSimulatorOutput | null>("clash-simulator-result", null)
  const [critiqueResult, setCritiqueResult] = useLocalStorage<StrategicSynthesisCritiqueOutput | null>("clash-critique-result", null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast()
  const { language } = useLanguage();
  const [agents] = useLocalStorage<Agent[]>('agents', []);
  const agentMap = useMemo(() => new Map(agents.map(a => [a.id, a])), [agents]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenarioDescription: "Une nouvelle technologie puissante, mais éthiquement ambiguë, a été développée par le collectif. Le groupe doit décider de la déployer, de la restreindre ou de la détruire.",
      perspectives: [
        { id: "helios" },
        { id: "eden" },
        { id: "symbioz" },
        { id: "vox" },
        { id: "disruptor" }
      ],
      numRounds: 5,
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "perspectives",
  });

  const watchPerspectives = form.watch('perspectives');
  const getPersonaNameById = (id: string) => agentMap.get(id)?.role || id;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    setCritiqueResult(null);
    try {
      const selectedPersonas = values.perspectives.map(p => {
        const agent = agentMap.get(p.id);
        if (!agent) throw new Error(`Agent with id ${p.id} not found.`);
        return {
          name: agent.role,
          values: agent.prompt,
        };
      });

      const flowInput = {
        scenarioDescription: values.scenarioDescription,
        numRounds: values.numRounds,
        perspectives: selectedPersonas,
        model: selectedModel,
        language,
      };

      const output = await cognitiveClashSimulator(flowInput);
      setResult(output);

      if (output.emergentSynthesis) {
        const critique = await strategicSynthesisCritique({
          synthesisText: output.emergentSynthesis,
          scenario: values.scenarioDescription,
          model: selectedModel,
          language,
        });
        setCritiqueResult(critique);
      }

    } catch (error) {
      console.error("Error running simulation:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la simulation. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const sortedPersonaList = useMemo(() => [...personaList].sort((a,b) => a.name[language].localeCompare(b.name[language])), [language]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{t.simulator.title[language]}</CardTitle>
        <CardDescription>{t.simulator.description[language]}</CardDescription>
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
                  <FormLabel>{t.simulator.scenario_label[language]}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.simulator.scenario_placeholder[language]} {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <Label className="mb-4 flex items-center gap-2"><Users />{t.simulator.perspectives_label[language]}</Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {fields.map((item, index) => {
                  const selectedId = form.watch(`perspectives.${index}.id`);
                  return (
                    <div key={item.id} className={cn("space-y-4 p-4 border-2 rounded-lg relative", perspectiveColors[index % perspectiveColors.length])}>
                      <FormField
                        control={form.control}
                        name={`perspectives.${index}.id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.simulator.perspective[language]} {index + 1}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.simulator.select_persona_placeholder[language]} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sortedPersonaList.map(p => 
                                  <SelectItem key={p.id} value={p.id}>{p.name[language]}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground pt-2 min-h-[50px]">
                              {agentMap.get(selectedId)?.prompt || t.simulator.directive_placeholder[language]}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                  )
                })}
              </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => append({ id: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t.simulator.add_button[language]}
                </Button>
            </div>
            
             <FormField
                control={form.control}
                name="numRounds"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>{t.simulator.rounds_label[language]}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.simulator.start_button_loading[language]}</>
              ) : (
                <><Zap className="mr-2 h-4 w-4" /> {t.simulator.start_button[language]}</>
              )}
            </Button>
          </form>
        </Form>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-headline">{t.simulator.analysis_title[language]}</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{t.simulator.analysis_loading[language]}</p>
            </div>
          )}
          {result && (
            <div className="space-y-6 animate-fade-in">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Milestone />{t.simulator.summary_title[language]}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{result.clashSummary}</p></CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Scale />{t.simulator.resilience_title[language]}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <Progress value={result.resilienceScore * 100} />
                             <p className="text-center font-bold text-2xl text-primary">{result.resilienceScore.toFixed(2)}</p>
                             <p className="text-xs text-center text-muted-foreground">{t.simulator.resilience_description[language]}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><GitMerge className="rotate-90"/>{t.simulator.polarization_title[language]}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <Progress value={result.polarizationIndex * 100} />
                             <p className="text-center font-bold text-2xl text-primary">{result.polarizationIndex.toFixed(2)}</p>
                             <p className="text-xs text-center text-muted-foreground">{t.simulator.polarization_description[language]}</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart2 />{t.simulator.synthesis_title[language]}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{result.emergentSynthesis}</p></CardContent>
                </Card>
                 <Accordion type="multiple" className="w-full">
                    <AccordionItem value="log">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2"><BotMessageSquare />{t.simulator.log_title[language]}</div>
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="space-y-6 max-h-[500px] overflow-y-auto p-4 border rounded-lg bg-background/50">
                            {result.simulationLog.map((turn) => {
                                const perspectiveIndex = watchPerspectives.findIndex(p => getPersonaNameById(p.id) === turn.perspectiveName);
                                return (
                                    <div key={turn.turn} className="flex items-start gap-4 animate-fade-in">
                                        <div className={cn("flex-1 p-4 rounded-lg border-2", perspectiveColors[perspectiveIndex % perspectiveColors.length] || 'border-gray-500/50')}>
                                            <div className="flex items-baseline justify-between">
                                                <p className="font-semibold text-primary">{turn.perspectiveName}</p>
                                                <span className="text-xs text-muted-foreground font-mono">{t.simulator.turn[language]} {turn.turn}</span>
                                            </div>
                                            <div className="mt-4 text-sm space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <Milestone className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">{t.simulator.position[language]}</span>
                                                        <p className="text-foreground/90">{turn.argument.position}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <BrainCircuit className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">{t.simulator.justification[language]}</span>
                                                        <p className="text-foreground/90">{turn.argument.justification}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <ShieldAlert className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">{t.simulator.risk[language]}</span>
                                                        <p className="text-foreground/90">{turn.argument.riskPerceived}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <FlaskConical className="h-4 w-4 text-secondary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">{t.simulator.proposal[language]}</span>
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
                                <div className="flex items-center gap-2"><GitBranch />{t.simulator.influence_title[language]}</div>
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
                                <div className="flex items-center gap-2"><LightbulbOff />{t.simulator.assumptions_title[language]}</div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-6 p-4 border rounded-lg bg-background/50 max-h-[500px] overflow-y-auto">
                                    {result.assumptionAnalysis.map((item, index) => (
                                        <div key={index} className="p-4 rounded-lg border bg-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge variant="destructive">{item.agentRole}</Badge>
                                                <span className="text-xs text-muted-foreground font-mono">{t.simulator.extracted_from_turn[language]} {item.turn}</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <SearchSlash className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">{t.simulator.implicit_assumption[language]}</span>
                                                        <p className="text-foreground/90 italic">"{item.assumption}"</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <MessageSquareWarning className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">{t.simulator.disruptor_critique[language]}</span>
                                                        <p className="text-foreground/90">{item.critique}</p>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                                    <div className="flex items-start gap-2">
                                                        <Users className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-foreground/80">{t.simulator.dominant_beneficiary[language]}</span>
                                                            <p className="text-muted-foreground">{item.dominantBeneficiary}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <UserX className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-foreground/80">{t.simulator.omitted_stakeholder[language]}</span>
                                                            <p className="text-muted-foreground">{item.omittedStakeholder}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <Library className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-foreground/80">{t.simulator.epistemic_frame[language]}</span>
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
                    {critiqueResult && (
                      <AccordionItem value="critique">
                          <AccordionTrigger>
                              <div className="flex items-center gap-2"><ShieldQuestion />{t.simulator.critique_title[language]}</div>
                          </AccordionTrigger>
                          <AccordionContent>
                              <div className="space-y-6 p-4 border rounded-lg bg-background/50 max-h-[600px] overflow-y-auto">
                                  <CritiqueSection icon={Check} title={t.simulator.critique_strengths[language]} items={critiqueResult.strengths} color="text-green-500" />
                                  <CritiqueSection icon={AlertTriangle} title={t.simulator.critique_weaknesses[language]} items={critiqueResult.weaknesses} color="text-amber-500" />
                                  <CritiqueSection icon={Route} title={t.simulator.critique_challenges[language]} items={critiqueResult.implementationChallenges} color="text-red-500" />
                                  <CritiqueSection icon={Hammer} title={t.simulator.critique_consequences[language]} items={critiqueResult.unintendedConsequences} color="text-purple-500" />
                                  <CritiqueSection icon={Lightbulb} title={t.simulator.critique_recommendations[language]} items={critiqueResult.recommendations} color="text-blue-500" />
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                    )}
                </Accordion>
            </div>
          )}
          {!isLoading && !result && (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-center">{t.simulator.no_results[language]}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const CritiqueSection = ({ icon: Icon, title, items, color }: { icon: React.ElementType, title: string, items: string[], color: string }) => (
  <div>
    <h4 className={cn("font-semibold flex items-center gap-2 mb-3", color)}>
      <Icon className="h-5 w-5" />
      {title}
    </h4>
    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  </div>
);