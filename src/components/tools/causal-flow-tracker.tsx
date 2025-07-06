"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const agents = [
  { id: 'helios', role: 'HELIOS (Innovation)', color: 'bg-purple-500' },
  { id: 'veritas', role: 'VERITAS (Transparence)', color: 'bg-green-500' },
  { id: 'symbioz', role: 'SYMBIOZ (Coopération)', color: 'bg-orange-500' },
  { id: 'vox', role: 'VOX (Voix Commune)', color: 'bg-blue-500' },
]

const flows = [
  { from: 'helios', to: 'symbioz' },
  { from: 'veritas', to: 'symbioz' },
  { from: 'symbioz', to: 'vox' },
]

const AgentNode = ({ role, color }: { role: string; color: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm min-w-[220px] justify-center">
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
          Visualisez comment les agents spécialisés s'influencent. (Ceci est une représentation visuelle statique).
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
                  <span className="text-xs text-muted-foreground">influence</span>
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
