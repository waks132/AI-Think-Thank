"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Download, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateReport, type GenerateReportOutput } from "@/ai/flows/report-generator-flow"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { useLanguage } from "@/context/language-context"
import { t } from "@/lib/i18n"
import useLocalStorage from "@/hooks/use-local-storage"
import type { AgentCollaborationOutput } from "@/ai/flows/agent-collaboration-flow"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"

export default function ReportGenerator() {
  const [collaborationResult] = useLocalStorage<AgentCollaborationOutput | null>("collaboration-result", null)
  const [mission] = useLocalStorage<string>('mission-text', '');
  const [report, setReport] = useState<GenerateReportOutput | null>(null);
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
          mission: mission,
          executiveSummary: collaborationResult.executiveSummary,
          collaborationLog: JSON.stringify(collaborationResult.collaborationLog),
          model: selectedModel,
          language,
       });
      setReport(result);
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
    if (!report?.reportMarkdown) return;
    const blob = new Blob([report.reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mission-report.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const webSearchUsed = report?.webSources && report.webSources.length > 0;

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
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <h3 className="font-semibold">{t.report.generated_report[language]}</h3>
                    <div className="flex items-center gap-2">
                        <Badge variant={webSearchUsed ? "default" : "secondary"}>
                            <Search className="mr-2 h-3 w-3" />
                            {t.report.web_search[language]} - {webSearchUsed ? t.report.used[language] : t.report.not_used[language]}
                        </Badge>
                        <Button onClick={handleDownload} variant="outline" size="sm">
                            <Download className="mr-2"/>
                            {t.report.download_button[language]}
                        </Button>
                    </div>
                </div>
                <Textarea 
                    readOnly
                    value={report.reportMarkdown}
                    className="h-[500px] font-mono text-xs bg-card"
                />
                {webSearchUsed && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">{t.report.sources_label[language]}</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 bg-card p-4 rounded-lg border">
                        {report.webSources.map((source, index) => (
                            <li key={index}>
                                <a href={source} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary break-all">{source}</a>
                            </li>
                        ))}
                    </ul>
                  </div>
                )}
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
