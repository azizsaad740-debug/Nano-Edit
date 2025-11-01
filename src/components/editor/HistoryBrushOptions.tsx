"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

interface HistoryBrushOptionsProps {
  activeTool: 'historyBrush' | 'artHistoryBrush';
  history: { name: string }[]; // Use the history prop
  // Placeholder props for brush settings (Size, Opacity, Flow are shared with BrushOptions)
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  brushFlow: number;
  setBrushFlow: (flow: number) => void;
  historyBrushSourceIndex: number; // NEW
  setHistoryBrushSourceIndex: (index: number) => void; // NEW
}

export const HistoryBrushOptions: React.FC<HistoryBrushOptionsProps> = ({
  activeTool,
  history,
  brushSize,
  setBrushSize,
  brushOpacity,
  setBrushOpacity,
  brushFlow,
  setBrushFlow,
  historyBrushSourceIndex,
  setHistoryBrushSourceIndex,
}) => {
  const isArtHistory = activeTool === 'artHistoryBrush';
  const [styleTolerance, setStyleTolerance] = React.useState(50);

  const handleHistorySelect = (value: string) => {
    const index = parseInt(value, 10);
    if (!isNaN(index)) {
      setHistoryBrushSourceIndex(index);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="history-state">Source State</Label>
        <Select 
          value={String(historyBrushSourceIndex)} 
          onValueChange={handleHistorySelect}
        >
          <SelectTrigger id="history-state">
            <SelectValue placeholder="Select History State" />
          </SelectTrigger>
          <SelectContent>
            {history.map((item, index) => (
              <SelectItem key={index} value={String(index)}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Separator />

      {/* Shared Brush Controls (Size, Opacity, Flow) */}
      <div className="space-y-1">
        <Label>Size ({brushSize})</Label>
        <Slider min={1} max={200} step={1} value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} />
      </div>
      <div className="space-y-1">
        <Label>Opacity ({brushOpacity}%)</Label>
        <Slider min={0} max={100} step={1} value={[brushOpacity]} onValueChange={([v]) => setBrushOpacity(v)} />
      </div>
      <div className="space-y-1">
        <Label>Flow ({brushFlow}%)</Label>
        <Slider min={0} max={100} step={1} value={[brushFlow]} onValueChange={([v]) => setBrushFlow(v)} />
      </div>

      {isArtHistory && (
        <>
          <Separator />
          <div className="grid gap-2">
            <Label htmlFor="style-variation">Style Variation (Stub)</Label>
            <Select defaultValue="tight-short">
              <SelectTrigger id="style-variation">
                <SelectValue placeholder="Tight Short" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tight-short">Tight Short</SelectItem>
                <SelectItem value="loose-long">Loose Long</SelectItem>
                <SelectItem value="dab">Dab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="style-tolerance">Style Tolerance</Label>
              <span className="w-10 text-right text-sm text-muted-foreground">{styleTolerance}</span>
            </div>
            <Slider
              id="style-tolerance"
              min={0}
              max={100}
              step={1}
              value={[styleTolerance]}
              onValueChange={([v]) => setStyleTolerance(v)}
            />
          </div>
        </>
      )}
    </div>
  );
};