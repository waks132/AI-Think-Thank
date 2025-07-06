"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateReport } from "@/ai/flows/report-generator-flow"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { useLanguage } from "@/context/language-context"
import { t } from "@/lib/i18n"
import useLocalStorage from "@/hooks/use-local-storage"
import type { AgentCollaborationOutput } from "@/ai/flows/agent-collaboration-flow"
import { Textarea } from "../ui/textarea"

export default function ReportGenerator() {
  const [collaborationResult] = useLocalStorage<AgentCollaborationOutput | null>("collaboration-result", null)
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleGenerateReport = async () => {
    if (!collaborationResult) {
        toast({
            variant: "destructive",
            title: t.report.no_data_title[language],
            description: t.report.no_data_description[language],
        });
        return;
    }

    setIsLoading(true);
    setReport(null);
    try {
      const result = await generateReport({ 
          executiveSummary: collaborationResult.executiveSummary,
          collaborationLog: JSON.stringify(collaborationResult.collaborationLog),
          model: selectedModel,
          language,
       });
      setReport(result.reportMarkdown);
    } catch (error) {
        console.error("Error generating report:", error);
        toast({
            variant: "destructive",
            title: t.report.fail_title[language],
            description: t.report.fail_description[language],
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mission-report.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{t.report.title[language]}</CardTitle>
        <CardDescription>{t.report.description[language]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel}/>
            <Button onClick={handleGenerateReport} disabled={isLoading || !collaborationResult}>
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : <FileText className="mr-2"/>}
                {t.report.generate_button[language]}
            </Button>
        </div>
        <div className="p-4 border-2 border-dashed rounded-lg bg-background/50 min-h-[400px]">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2"/>
                <p>{t.report.loading_text[language]}</p>
             </div>
           ) : report ? (
             <div className="space-y-4">
                <Textarea 
                    readOnly
                    value={report}
                    className="h-[500px] font-mono text-xs bg-card"
                />
                <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2"/>
                    {t.report.download_button[language]}
                </Button>
            </div>
           ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                <p>{t.report.no_report[language]}</p>
             </div>
           )}
        </div>
      </CardContent>
    </Card>
  )
}
