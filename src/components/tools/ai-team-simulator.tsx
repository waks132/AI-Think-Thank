"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { aiTeamSimulator, type AiTeamSimulatorOutput } from "@/ai/flows/ai-team-simulator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Flame, Loader2, Bot } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const formSchema = z.object({
  scenarioDescription: z.string().min(20, { message: "Scenario must be at least 20 characters." }),
  teamAStrategy: z.string().min(10, { message: "Team A strategy must be at least 10 characters." }),
  teamBStrategy: z.string().min(10, { message: "Team B strategy must be at least 10 characters." }),
  numRounds: z.coerce.number().min(1).max(10).default(3),
})

export default function AiTeamSimulator() {
  const [result, setResult] = useState<AiTeamSimulatorOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenarioDescription: "Resolve a city-wide power outage caused by a cyber-attack on the main grid.",
      teamAStrategy: "Focus on rapid, decentralized restoration of power to critical infrastructure first.",
      teamBStrategy: "Prioritize identifying and neutralizing the cyber threat before restoring any power.",
      numRounds: 3,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setResult(null)
    try {
      const output = await aiTeamSimulator(values)
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
        <CardTitle className="font-headline text-2xl">AI Team vs. AI Team Simulator</CardTitle>
        <CardDescription>Test resolution strategies by pitting two AI teams against each other in a simulated scenario.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="scenarioDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the scenario for the AI teams..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="teamAStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team A Strategy</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe Team A's strategy..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teamBStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team B Strategy</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe Team B's strategy..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="numRounds"
                render={({ field }) => (
                  <FormItem>
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Simulation...</>
              ) : (
                <><Flame className="mr-2 h-4 w-4" /> Start Simulation</>
              )}
            </Button>
          </form>
        </Form>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-headline">Simulation Results</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Simulation in progress...</p>
            </div>
          )}
          {result && (
            <Card className="animate-fade-in">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Round</TableHead>
                      <TableHead>Team A Response</TableHead>
                      <TableHead>Team B Response</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.simulationResults.map((round) => (
                      <TableRow key={round.round}>
                        <TableCell className="font-medium">{round.round}</TableCell>
                        <TableCell>{round.teamAResponse}</TableCell>
                        <TableCell>{round.teamBResponse}</TableCell>
                        <TableCell>{round.outcome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {!isLoading && !result && (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-center">Simulation results will appear here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
