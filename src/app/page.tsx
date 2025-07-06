import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/header"
import MultiAgentDashboard from "@/components/dashboard/multi-agent-dashboard"
import CognitiveClashSimulator from "@/components/tools/ai-team-simulator"
import AdaptivePromptOrchestrator from "@/components/tools/adaptive-prompt-orchestrator"
import AutoPromptCurator from "@/components/tools/auto-prompt-curator"
import DivergenceMetricsTool from "@/components/tools/divergence-metrics-tool"
import AgentReasoningTool from "@/components/tools/agent-reasoning-tool"
import PromptLineageViewer from "@/components/tools/prompt-lineage-viewer"
import CognitiveLogViewer from "@/components/tools/cognitive-log-viewer"
import CognitiveHeatmap from "@/components/tools/cognitive-heatmap"
import CausalFlowTracker from "@/components/tools/causal-flow-tracker"

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="simulations">Simulations</TabsTrigger>
            <TabsTrigger value="prompt_tools">Prompt Tools</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <MultiAgentDashboard />
          </TabsContent>
          
          <TabsContent value="simulations" className="mt-6">
            <CognitiveClashSimulator />
          </TabsContent>

          <TabsContent value="prompt_tools" className="mt-6">
            <Tabs defaultValue="rewriter" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto flex-wrap">
                <TabsTrigger value="rewriter">Adaptive Rewriter</TabsTrigger>
                <TabsTrigger value="curator">Auto Curator</TabsTrigger>
                <TabsTrigger value="divergence">Divergence Metrics</TabsTrigger>
                <TabsTrigger value="reasoning">Agent Reasoning</TabsTrigger>
                <TabsTrigger value="lineage">Prompt Lineage</TabsTrigger>
              </TabsList>
              <TabsContent value="rewriter" className="mt-6"><AdaptivePromptOrchestrator /></TabsContent>
              <TabsContent value="curator" className="mt-6"><AutoPromptCurator /></TabsContent>
              <TabsContent value="divergence" className="mt-6"><DivergenceMetricsTool /></TabsContent>
              <TabsContent value="reasoning" className="mt-6"><AgentReasoningTool /></TabsContent>
              <TabsContent value="lineage" className="mt-6"><PromptLineageViewer /></TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto flex-wrap">
                <TabsTrigger value="logs">Cognitive Logs</TabsTrigger>
                <TabsTrigger value="heatmap">Cognitive Heatmap</TabsTrigger>
                <TabsTrigger value="causal_flow">Causal Flow</TabsTrigger>
              </TabsList>
              <TabsContent value="logs" className="mt-6"><CognitiveLogViewer /></TabsContent>
              <TabsContent value="heatmap" className="mt-6"><CognitiveHeatmap /></TabsContent>
              <TabsContent value="causal_flow" className="mt-6"><CausalFlowTracker /></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
