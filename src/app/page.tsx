"use client";

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
import ReportGenerator from "@/components/tools/report-generator"
import { useLanguage } from "@/context/language-context"
import { t } from "@/lib/i18n"

export default function Home() {
  const { language } = useLanguage();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto flex-wrap">
            <TabsTrigger value="dashboard">{t.page.dashboard[language]}</TabsTrigger>
            <TabsTrigger value="simulations">{t.page.simulations[language]}</TabsTrigger>
            <TabsTrigger value="prompt_tools">{t.page.prompt_tools[language]}</TabsTrigger>
            <TabsTrigger value="analysis">{t.page.analysis[language]}</TabsTrigger>
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
                <TabsTrigger value="rewriter">{t.page.rewriter[language]}</TabsTrigger>
                <TabsTrigger value="curator">{t.page.curator[language]}</TabsTrigger>
                <TabsTrigger value="divergence">{t.page.divergence[language]}</TabsTrigger>
                <TabsTrigger value="reasoning">{t.page.reasoning[language]}</TabsTrigger>
                <TabsTrigger value="lineage">{t.page.lineage[language]}</TabsTrigger>
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
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto flex-wrap">
                <TabsTrigger value="logs">{t.page.logs[language]}</TabsTrigger>
                <TabsTrigger value="heatmap">{t.page.heatmap[language]}</TabsTrigger>
                <TabsTrigger value="causal_flow">{t.page.causal_flow[language]}</TabsTrigger>
                <TabsTrigger value="report">{t.page.report[language]}</TabsTrigger>
              </TabsList>
              <TabsContent value="logs" className="mt-6"><CognitiveLogViewer /></TabsContent>
              <TabsContent value="heatmap" className="mt-6"><CognitiveHeatmap /></TabsContent>
              <TabsContent value="causal_flow" className="mt-6"><CausalFlowTracker /></TabsContent>
              <TabsContent value="report" className="mt-6"><ReportGenerator /></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
