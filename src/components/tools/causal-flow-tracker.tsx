"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const agents = [
  { id: 'analyst', role: 'Analyst', color: 'bg-blue-500' },
  { id: 'creative', role: 'Creative', color: 'bg-purple-500' },
  { id: 'fact_checker', role: 'Fact-Checker', color: 'bg-green-500' },
  { id: 'integrator', role: 'Integrator', color: 'bg-orange-500' },
]

const flows = [
  { from: 'analyst', to: 'integrator' },
  { from: 'creative', to: 'integrator' },
  { from: 'fact_checker', to: 'analyst' },
  { from: 'fact_checker', to: 'creative' },
]

const AgentNode = ({ role, color }: { role: string; color: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
    <div className={`h-3 w-3 rounded-full ${color}`} />
    <span className="font-medium">{role}</span>
  </div>
)

export default function CausalFlowTracker() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Causal Flow Tracker</CardTitle>
        <CardDescription>
          Visualize which agents influence which decisions. (This is a static visual representation).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center min-h-[400px]">
        <div className="w-full max-w-2xl space-y-8">
          {flows.map((flow, index) => {
            const fromAgent = agents.find(a => a.id === flow.from);
            const toAgent = agents.find(a => a.id === flow.to);
            if (!fromAgent || !toAgent) return null;
            return (
              <div key={index} className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <AgentNode role={fromAgent.role} color={fromAgent.color} />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">influences</span>
                  <ArrowRight className="h-8 w-8 text-primary/50" />
                </div>
                <AgentNode role={toAgent.role} color={toAgent.color} />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
