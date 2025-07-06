"use client";

import { availableModels } from "@/lib/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "./ui/label";
import { Bot } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  label?: string;
  className?: string;
}

export default function ModelSelector({ selectedModel, onModelChange, label="Select AI Model", className }: ModelSelectorProps) {
  return (
    <div className={className}>
      <Label htmlFor="model-selector" className="flex items-center gap-2 mb-2">
        <Bot className="h-4 w-4" />
        {label}
      </Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger id="model-selector" className="w-full">
          <SelectValue placeholder="Choose a model..." />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
