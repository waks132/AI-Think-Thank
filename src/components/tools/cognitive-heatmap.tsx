"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const text = "The primary mission objective is to establish a self-sustaining hydroponics farm on Mars. Key challenges include radiation shielding, water reclamation, and adapting Earth-based plants to the Martian environment. Our strategy prioritizes a modular, scalable architecture, allowing for incremental expansion. The initial phase will focus on robust life support and energy systems, followed by the deployment of the agricultural modules. This approach mitigates risk and ensures core systems are operational before expanding."

const wordWeights: { [key: string]: number } = {
  mission: 0.8,
  hydroponics: 1.0,
  Mars: 0.9,
  radiation: 0.7,
  water: 0.8,
  strategy: 0.9,
  scalable: 0.85,
  energy: 0.95,
  risk: 0.75,
  agricultural: 1.0
}

const HeatmapText = () => {
  const words = text.split(/(\s+)/); // Split by space, keeping spaces
  return (
    <p className="text-lg leading-relaxed">
      {words.map((word, index) => {
        const cleanWord = word.replace(/[.,]/g, '').toLowerCase();
        const weight = wordWeights[cleanWord] || 0;
        const opacity = Math.max(weight, 0.1);
        const color = weight > 0.85 ? 'bg-primary/30' : 'bg-secondary/30';

        if (weight > 0) {
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Cognitive Heatmap</CardTitle>
        <CardDescription>
          A visual representation of semantic activation zones in a text. (This is a static simulation).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 bg-card rounded-b-lg">
        <div className="p-6 border rounded-lg shadow-inner bg-background/50">
           <HeatmapText />
        </div>
      </CardContent>
    </Card>
  )
}
