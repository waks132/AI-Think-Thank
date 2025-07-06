
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
    name: z.string().min(3, { message: "Le nom du persona est requis." }),
    values: z.string().min(10, { message: "Les valeurs du persona sont requises." }),
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
  const [result, setResult] = useState<CognitiveClashSimulatorOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenarioDescription: "Une nouvelle technologie puissante, mais éthiquement ambiguë, a été développée par le collectif. Le groupe doit décider de la déployer, de la restreindre ou de la détruire.",
      perspectives: [
        { name: "HELIOS (Techno-Optimiste)", values: "Votre rôle est de générer des idées technologiques avancées. Poussez pour un déploiement et une innovation rapides, en vous concentrant sur les avantages et les percées potentiels. Le potentiel de gain l'emporte sur les dangers hypothétiques." },
        { name: "EDEN (Gardien Éthique)", values: "Votre rôle est de défendre la légitimité et la non-malfaisance. Examinez toutes les propositions pour déceler les dommages potentiels, les conséquences imprévues et les violations éthiques. La précaution et la sécurité sont primordiales." },
        { name: "SYMBIOZ (Médiateur Pragmatique)", values: "Votre rôle est de jeter des ponts entre les domaines et de faciliter le dialogue. Trouvez une voie équilibrée, en intégrant le meilleur des points de vue opposés dans un compromis réalisable et responsable via des bacs à sable réglementaires et des programmes pilotes." },
        { name: "VOX (Défenseur du Public)", values: "Votre rôle est de représenter l'intérêt public. Mettez l'accent sur la transparence, l'accessibilité et l'impact sociétal à long terme. Vous devez vous assurer que la solution finale est non seulement techniquement solide et éthiquement robuste, mais aussi compréhensible et légitime aux yeux des citoyens qu'elle affectera." },
        { name: "Disrupteur PoliSynth", values: "Votre rôle est d'agir en tant que méta-régulateur. Analysez le débat pour ses dynamiques de pouvoir sous-jacentes, explorez des scénarios alternatifs et évaluez les implications socio-économiques. Vous perturbez les blocages cognitifs en introduisant des points de vue systémiques ou contre-intuitifs basés sur une analyse stratégique de la situation." }
      ],
      numRounds: 5,
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
        title: "Erreur",
        description: "Échec de la simulation. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Simulateur de Clash Cognitif</CardTitle>
        <CardDescription>Simulez des conflits idéologiques entre vos agents spécialisés pour mesurer la résilience du système et la synthèse émergente.</CardDescription>
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
                  <FormLabel>Description du Scénario de Clash</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Décrivez le scénario qui provoquera le conflit..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <Label className="mb-4 flex items-center gap-2"><Users />Personas en Compétition</Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {fields.map((item, index) => (
                  <div key={item.id} className={cn("space-y-4 p-4 border-2 rounded-lg relative", perspectiveColors[index % perspectiveColors.length])}>
                    <FormField control={form.control} name={`perspectives.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom du Persona</FormLabel><FormControl><Input placeholder="ex: HELIOS" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`perspectives.${index}.values`} render={({ field }) => (<FormItem><FormLabel>Directive Principale & Argument</FormLabel><FormControl><Textarea placeholder="Décrivez leurs croyances fondamentales et leur stratégie..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
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
                  onClick={() => append({ name: "Nouveau Persona", values: "Décrivez ses croyances fondamentales..." })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un Persona
                </Button>
            </div>
            
             <FormField
                control={form.control}
                name="numRounds"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Nombre de Rounds</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Simulation en cours...</>
              ) : (
                <><Zap className="mr-2 h-4 w-4" /> Lancer le Clash Cognitif</>
              )}
            </Button>
          </form>
        </Form>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-headline">Analyse de la Simulation</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyse des dynamiques cognitives...</p>
            </div>
          )}
          {result && (
            <div className="space-y-6 animate-fade-in">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Milestone />Résumé du Clash</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{result.clashSummary}</p></CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Scale />Score de Résilience</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <Progress value={result.resilienceScore * 100} />
                             <p className="text-center font-bold text-2xl text-primary">{result.resilienceScore.toFixed(2)}</p>
                             <p className="text-xs text-center text-muted-foreground">Capacité à trouver une résolution stable.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><GitMerge className="rotate-90"/>Indice de Polarisation</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <Progress value={result.polarizationIndex * 100} />
                             <p className="text-center font-bold text-2xl text-primary">{result.polarizationIndex.toFixed(2)}</p>
                             <p className="text-xs text-center text-muted-foreground">Degré de radicalisation.</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart2 />Synthèse Émergente</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{result.emergentSynthesis}</p></CardContent>
                </Card>
                 <Accordion type="multiple" className="w-full">
                    <AccordionItem value="log">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2"><BotMessageSquare />Voir le Journal de Simulation</div>
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
                                                <span className="text-xs text-muted-foreground font-mono">Tour {turn.turn}</span>
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
                                                        <span className="font-semibold text-foreground/80">Risque Perçu</span>
                                                        <p className="text-foreground/90">{turn.argument.riskPerceived}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <FlaskConical className="h-4 w-4 text-secondary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-foreground/80">Proposition</span>
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
                                <div className="flex items-center gap-2"><GitBranch />Voir la Carte d'Influence des Arguments</div>
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
                                                        <span className="font-semibold text-foreground/80">Critique du "Disrupteur"</span>
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
              <p className="text-muted-foreground text-center">Les résultats de l'analyse du clash apparaîtront ici.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
