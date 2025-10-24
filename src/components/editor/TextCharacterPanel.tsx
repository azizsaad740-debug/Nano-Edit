"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bold, Italic, Type, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, ArrowDownUp, CornerDownLeft, Settings } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";
import { Button } from "@/components/ui/button";

interface TextCharacterPanelProps {
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
  onCommit: () => void;
  availableFonts: string[];
  onOpenFontManager: () => void;
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

// Helper component for icon buttons with select inputs
const SelectControl = ({ icon: Icon, value, onChange, options, placeholder = 'Auto' }: any) => (
  <div className="flex items-center border rounded-md h-8">
    <Button variant="ghost" size="icon" className="h-full w-8 p-1 shrink-0">
      <Icon className="h-4 w-4" />
    </Button>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-full flex-1 border-y-0 border-x border-input rounded-none text-xs p-1">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);


export const TextCharacterPanel = ({ layer, onUpdate, onCommit, availableFonts, onOpenFontManager }: TextCharacterPanelProps) => {
  const handleStyleChange = (styles: string[]) => {
    const isBold = styles.includes("bold");
    const isItalic = styles.includes("italic");
    onUpdate({
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
    });
    onCommit();
  };

  const currentStyles = [];
  if (layer.fontWeight === 'bold') currentStyles.push('bold');
  if (layer.fontStyle === 'italic') currentStyles.push('italic');

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="font-family">Font Family</Label>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onOpenFontManager}>
            <Settings className="h-3 w-3" />
            <span className="sr-only">Manage Fonts</span>
          </Button>
        </div>
        <Select 
          value={layer.fontFamily} 
          onValueChange={(value) => {
            onUpdate({ fontFamily: value });
            onCommit();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {availableFonts.map(font => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <SelectControl 
          icon={ChevronDown} 
          value={layer.fontWeight} 
          onChange={(v: string) => onUpdate({ fontWeight: v as 'normal' | 'bold' })}
          options={['Regular', 'Bold']}
          placeholder="Regular"
        />
        <TextControl 
          icon={Type} 
          value={layer.fontSize} 
          onChange={(v: number) => onUpdate({ fontSize: v })}
          onCommit={onCommit}
          unit="pt"
          min={8}
          max={256}
          placeholder="48"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Leading (Unsupported - Placeholder) */}
        <SelectControl 
          icon={ChevronUp} 
          value="Metrics" 
          onChange={() => {}}
          options={['Metrics', 'Optical']}
          placeholder="Metrics"
        />
        {/* Tracking (Unsupported - Placeholder) */}
        <TextControl 
          icon={ArrowLeft} 
          value={0} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="0"
          min={-100}
          max={100}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Horizontal Scale (Unsupported - Placeholder) */}
        <TextControl 
          icon={ArrowRight} 
          value={100} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="%"
          min={1}
          max={500}
          placeholder="100"
        />
        {/* Vertical Scale (Unsupported - Placeholder) */}
        <TextControl 
          icon={ArrowDownUp} 
          value={100} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="%"
          min={1}
          max={500}
          placeholder="100"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Baseline Shift (Unsupported - Placeholder) */}
        <TextControl 
          icon={CornerDownLeft} 
          value={0} 
          onChange={() => {}}
          onCommit={() => {}}
          unit="pt"
          placeholder="0"
        />
        {/* Color (Supported) */}
        <div className="flex items-center border rounded-md h-8">
          <Label htmlFor="color" className="text-xs px-2 shrink-0">Color</Label>
          <Input
            id="color"
            type="color"
            className="p-1 h-full w-10 border-y-0 border-x border-input rounded-none"
            value={layer.color || "#FFFFFF"}
            onChange={(e) => onUpdate({ color: e.target.value })}
            onBlur={onCommit}
          />
        </div>
      </div>

      <div className="grid gap-2 pt-2 border-t">
        <Label>Style & Effects</Label>
        <ToggleGroup type="multiple" value={currentStyles} onValueChange={handleStyleChange} className="justify-start">
          <ToggleGroupItem value="bold" aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          {/* Placeholder Type Options */}
          <ToggleGroupItem value="all-caps" aria-label="All Caps" disabled>
            <span className="font-bold text-lg">TT</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="small-caps" aria-label="Small Caps" disabled>
            <span className="font-bold text-lg">T<span className="text-sm">T</span></span>
          </ToggleGroupItem>
          <ToggleGroupItem value="superscript" aria-label="Superscript" disabled>
            <span className="font-bold text-lg">T<span className="text-xs align-top">¹</span></span>
          </ToggleGroupItem>
          <ToggleGroupItem value="subscript" aria-label="Subscript" disabled>
            <span className="font-bold text-lg">T<span className="text-xs align-bottom">₁</span></span>
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline" disabled>
            <span className="font-bold text-lg underline">T</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="strikethrough" aria-label="Strikethrough" disabled>
            <span className="font-bold text-lg line-through">T</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};