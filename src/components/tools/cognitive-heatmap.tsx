"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Loader2, Thermometer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateCognitiveHeatmap } from "@/ai/flows/cognitive-heatmap-flow"
import type { HeatmapWord } from "@/lib/types"
import ModelSelector from "../model-selector"
import { availableModels } from "@/lib/models"
import { useLanguage } from "@/context/language-context"
import { t } from "@/lib/i18n"
import useLocalStorage from "@/hooks/use-local-storage"

const initialText = "The primary mission objective is to establish a self-sustaining hydroponics farm on Mars. Key challenges include radiation shielding, water reclamation, and adapting Earth-based plants to the Martian environment. Our strategy prioritizes a modular, scalable architecture, allowing for incremental expansion. The initial phase will focus on robust life support and energy systems, followed by the deployment of the agricultural modules. This approach mitigates risk and ensures core systems are operational before expanding."

const HeatmapTextView = ({ text, heatmap }: { text: string, heatmap: HeatmapWord[] }) => {
  const words = text.split(/(\s+)/); // Split by space, keeping spaces
  const wordWeights: { [key: string]: number } = heatmap.reduce((acc, curr) => {
    acc[curr.word.toLowerCase()] = curr.weight;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <p className="text-lg leading-relaxed">
      {words.map((word, index) => {
        const cleanWord = word.replace(/[.,]/g, '').toLowerCase();
        const weight = wordWeights[cleanWord] || 0;

        if (weight > 0.1) {
          const opacity = Math.max(weight, 0.2);
          const color = weight > 0.8 ? 'bg-primary/40' : 'bg-secondary/30';
          return (
            <span
              key={index}
              className={`p-1 rounded-md transition-all duration-300 ${color}`}
              style={{ opacity }}
            >
              {word}
            </span>
          )
        }
        return <span key={index}>{word}</span>;
      })}
    </p>
  )
}

export default function CognitiveHeatmap() {
  const [text, setText] = useState(initialText);
  const [heatmap, setHeatmap] = useLocalStorage<HeatmapWord[]>("cognitive-heatmap-result", []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setHeatmap([]);
    try {
      const result = await generateCognitiveHeatmap({ text, model: selectedModel });
      setHeatmap(result.heatmap);
    } catch (error) {
        console.error("Error generating heatmap:", error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Could not generate cognitive heatmap.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{t.heatmap.title[language]}</CardTitle>
        <CardDescription>{t.heatmap.description[language]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel}/>
        <Textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.heatmap.placeholder[language]}
            rows={8}
        />
        <Button onClick={handleAnalyze} disabled={isLoading || !text}>
            {isLoading ? <Loader2 className="animate-spin"/> : <Thermometer />}
            {t.heatmap.analyze_button[language]}
        </Button>
        <div className="p-6 border rounded-lg shadow-inner bg-background/50 min-h-[200px]">
           {isLoading ? (
             <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2"/>
                {t.heatmap.loading_text[language]}
             </div>
           ) : heatmap.length > 0 ? (
             <HeatmapTextView text={text} heatmap={heatmap} />
           ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>{t.heatmap.no_results[language]}</p>
             </div>
           )}
        </div>
      </CardContent>
    </Card>
  )
}
