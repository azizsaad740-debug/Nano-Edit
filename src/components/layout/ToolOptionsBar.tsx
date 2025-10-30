"use client";

import * as React from "react";
import { Brush, Settings, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ActiveTool, BrushState } from "@/types/editor";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolOptionsBarProps {
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  onBrushCommit: () => void;
}

const blendModes = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", 
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference", 
  "exclusion", "hue", "saturation", "color", "luminosity"
];

const ToolOptionsBar: React.FC<ToolOptionsBarProps> = ({
  activeTool,
  brushState,
  setBrushState,
  onBrushCommit,
}) => {
  const isBrushTool = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'pencil' || activeTool === 'selectionBrush' || activeTool === 'blurBrush' || activeTool === 'cloneStamp' || activeTool === 'patternStamp' || activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
  
  const handleResetBrush = () => {
    setBrushState({ 
      size: 20, 
      hardness: 50, 
      opacity: 100, 
      flow: 100, 
      smoothness: 10,
      blendMode: 'normal',
    });
    onBrushCommit();
  };

  const renderBrushOptions = () => (
    <div className="flex items-center space-x-4 h-full">
      <div className="flex items-center space-x-2">
        <Brush className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Brush Tool Options</span>
      </div>
      <Separator orientation="vertical" className="h-6" />
      
      {/* Size */}
      <div className="flex items-center space-x-2">
        <Label className="text-sm text-muted-foreground">Size:</Label>
        <Input
          type="number"
          value={brushState.size}
          onChange={(e) => setBrushState({ size: parseInt(e.target.value) || 1 })}
          onBlur={onBrushCommit}
          min={1}
          max={200}
          className="w-16 h-7 text-sm text-right"
        />
      </div>
      
      {/* Hardness Slider */}
      <div className="flex items-center space-x-2 w-40">
        <Label className="text-sm text-muted-foreground">Hardness:</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[brushState.hardness]}
          onValueChange={([value]) => setBrushState({ hardness: value })}
          onValueCommit={onBrushCommit}
          className="flex-1"
        />
        <span className="w-8 text-right text-sm text-muted-foreground">{brushState.hardness}%</span>
      </div>
      
      {/* Mode */}
      <div className="flex items-center space-x-2">
        <Label className="text-sm text-muted-foreground">Mode:</Label>
        <Select
          value={brushState.blendMode}
          onValueChange={(value) => setBrushState({ blendMode: value })}
          onOpenChange={(open) => !open && onBrushCommit()}
        >
          <SelectTrigger className="w-[120px] h-7 text-sm">
            <SelectValue placeholder="Normal" />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map(mode => (
              <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Separator orientation="vertical" className="h-6" />

      {/* Reset/Save */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleResetBrush}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Brush
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset Brush Settings</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => console.log("Save Brush Preset Stub")}>
            Save Preset
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save Current Brush Settings</TooltipContent>
      </Tooltip>
    </div>
  );

  if (isBrushTool) {
    return (
      <div className="w-full h-10 border-b bg-background px-4 flex items-center justify-between shrink-0">
        {renderBrushOptions()}
      </div>
    );
  }

  // Default/Placeholder for other tools
  return (
    <div className="w-full h-10 border-b bg-background px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {activeTool ? `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Tool Options` : "Global Options"}
        </span>
      </div>
    </div>
  );
};

export default ToolOptionsBar;