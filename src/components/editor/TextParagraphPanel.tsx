"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronDown, ChevronUp, CornerDownLeft, ArrowRight, ArrowLeft } from "lucide-react";
import type { Layer } from "@/types/editor";
import { Button } from "@/components/ui/button";

interface TextParagraphPanelProps {
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
  onCommit: () => void;
}

// Helper component for icon buttons with text/value inputs
const TextControl = ({ icon: Icon, value, onChange, onCommit, unit = 'pt', min = 0, max = 100, step = 1, placeholder = '0' }: any) => (
  <div className="flex items-center border rounded-md h-8">
    <Button variant="ghost" size="icon" className="h-full w-8 p-1 shrink-0">
      <Icon className="h-4 w-4" />
    </Button>
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onBlur={onCommit}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className="h-full flex-1 border-y-0 border-x border-input rounded-none text-xs text-center p-0"
    />
    <span className="text-xs text-muted-foreground px-1.5 shrink-0">{unit}</span>
  </div>
);

export const TextParagraphPanel = ({ layer, onUpdate, onCommit }: TextParagraphPanelProps) => {
  const handleAlignChange = (align: string) => {
    if (align) {
      onUpdate({ textAlign: align as 'left' | 'center' | 'right' });
      onCommit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Alignment</Label>
        <ToggleGroup type="single" value={layer.textAlign || 'center'} onValueChange={handleAlignChange} className="justify-start">
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Justify" disabled>
            <AlignJustify className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Indent Left (Unsupported - Placeholder) */}
        <TextControl 
          icon={ArrowRight} 
          value={0} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="pt"
          placeholder="0"
        />
        {/* Indent Right (Unsupported - Placeholder) */}
        <TextControl 
          icon={ArrowLeft} 
          value={0} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="pt"
          placeholder="0"
        />
        {/* First Line Indent (Unsupported - Placeholder) */}
        <TextControl 
          icon={CornerDownLeft} 
          value={0} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="pt"
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Space Before (Unsupported - Placeholder) */}
        <TextControl 
          icon={ChevronUp} 
          value={0} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="pt"
          placeholder="0"
        />
        {/* Space After (Unsupported - Placeholder) */}
        <TextControl 
          icon={ChevronDown} 
          value={0} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="pt"
          placeholder="0"
        />
      </div>
    </div>
  );
};