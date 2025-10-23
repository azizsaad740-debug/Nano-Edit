"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify, MoreHorizontal, ChevronDown, ChevronUp, Minus, Plus, CornerDownLeft, List, ListOrdered, Square, ArrowRight, ArrowLeft, Type, ArrowDownUp } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface TextPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
}

const fonts = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Playfair Display", "Lobster", "Pacifico"
];

const colorPalette = ["#FFFFFF", "#000000", "#EF4444", "#3B82F6", "#22C55E", "#F97316", "#EAB308"];

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

const TextProperties = ({ layer, onUpdate, onCommit }: TextPropertiesProps) => {
  if (!layer || layer.type !== 'text') {
    return <p className="text-sm text-muted-foreground">Select a text layer to edit its properties.</p>;
  }

  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const handleCommit = () => {
    onCommit(layer.id);
  };

  const handleStyleChange = (styles: string[]) => {
    const isBold = styles.includes("bold");
    const isItalic = styles.includes("italic");
    handleUpdate({
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
    });
    handleCommit();
  };

  const handleAlignChange = (align: string) => {
    if (align) {
      handleUpdate({ textAlign: align as 'left' | 'center' | 'right' });
      handleCommit();
    }
  };

  const handleEffectEnabledChange = (
    effect: 'backgroundColor' | 'stroke' | 'textShadow',
    enabled: boolean
  ) => {
    if (enabled) {
      const defaultValues = {
        backgroundColor: layer.backgroundColor || '#000000',
        stroke: layer.stroke || { color: '#000000', width: 2 },
        textShadow: layer.textShadow || { color: 'rgba(0,0,0,0.5)', blur: 5, offsetX: 2, offsetY: 2 },
      };
      handleUpdate({ [effect]: defaultValues[effect] });
    } else {
      const updates: Partial<Layer> = { [effect]: undefined };
      if (effect === 'backgroundColor') updates.padding = layer.padding;
      handleUpdate(updates);
    }
    handleCommit();
  };

  const currentStyles = [];
  if (layer.fontWeight === 'bold') currentStyles.push('bold');
  if (layer.fontStyle === 'italic') currentStyles.push('italic');

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="content">Text Content</Label>
        <Input
          id="content"
          value={layer.content || ""}
          onChange={(e) => handleUpdate({ content: e.target.value })}
          onBlur={handleCommit}
          className="h-10"
        />
      </div>

      <Accordion type="multiple" className="w-full" defaultValue={['character', 'paragraph']}>
        {/* -------------------------------------------------------------------- */}
        {/* CHARACTER PANEL */}
        {/* -------------------------------------------------------------------- */}
        <AccordionItem value="character">
          <AccordionTrigger className="font-semibold">Character</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select 
                value={layer.fontFamily} 
                onValueChange={(value) => {
                  handleUpdate({ fontFamily: value });
                  handleCommit();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map(font => (
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
                onChange={(v: string) => handleUpdate({ fontWeight: v as 'normal' | 'bold' })}
                options={['Regular', 'Bold']}
                placeholder="Regular"
              />
              <TextControl 
                icon={Type} 
                value={layer.fontSize} 
                onChange={(v: number) => handleUpdate({ fontSize: v })}
                onCommit={handleCommit}
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
                min={-100}
                max={100}
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
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                  onBlur={handleCommit}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Language (Unsupported - Placeholder) */}
              <SelectControl 
                icon={MoreHorizontal} 
                value="English: USA" 
                onChange={() => {}}
                options={['English: USA', 'Spanish', 'Arabic']}
                placeholder="English: USA"
              />
              {/* Anti-aliasing (Unsupported - Placeholder) */}
              <SelectControl 
                icon={MoreHorizontal} 
                value="Sharp" 
                onChange={() => {}}
                options={['Sharp', 'Smooth', 'None']}
                placeholder="Sharp"
              />
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
          </AccordionContent>
        </AccordionItem>

        {/* -------------------------------------------------------------------- */}
        {/* PARAGRAPH PANEL */}
        {/* -------------------------------------------------------------------- */}
        <AccordionItem value="paragraph">
          <AccordionTrigger className="font-semibold">Paragraph</AccordionTrigger>
          <AccordionContent className="space-y-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* -------------------------------------------------------------------- */}
        {/* ADVANCED PROPERTIES (Combined into one for simplicity) */}
        {/* -------------------------------------------------------------------- */}
        <AccordionItem value="advanced-transforms">
          <AccordionTrigger className="font-semibold">Advanced Transforms</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="letter-spacing">Letter Spacing (Tracking)</Label>
                <span className="text-sm text-muted-foreground">{layer.letterSpacing}px</span>
              </div>
              <Slider
                id="letter-spacing"
                min={-5}
                max={20}
                step={0.5}
                value={[layer.letterSpacing || 0]}
                onValueChange={([v]) => handleUpdate({ letterSpacing: v })}
                onValueCommit={handleCommit}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotation">Rotation</Label>
                <span className="text-sm text-muted-foreground">{layer.rotation}°</span>
              </div>
              <Slider
                id="rotation"
                min={-180}
                max={180}
                step={1}
                value={[layer.rotation || 0]}
                onValueChange={([v]) => handleUpdate({ rotation: v })}
                onValueCommit={handleCommit}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="opacity">Opacity</Label>
                <span className="text-sm text-muted-foreground">{layer.opacity ?? 100}%</span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={100}
                step={1}
                value={[layer.opacity ?? 100]}
                onValueChange={([v]) => handleUpdate({ opacity: v })}
                onValueCommit={handleCommit}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* -------------------------------------------------------------------- */}
        {/* EFFECTS PANEL (Moved from original TextProperties) */}
        {/* -------------------------------------------------------------------- */}
        <AccordionItem value="effects">
          <AccordionTrigger className="font-semibold">Effects</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="background">
                <AccordionTrigger className="py-2 text-sm">Background</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bg-enabled">Enable Background</Label>
                    <Switch id="bg-enabled" checked={!!layer.backgroundColor} onCheckedChange={(c) => handleEffectEnabledChange('backgroundColor', c)} />
                  </div>
                  {layer.backgroundColor && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="bg-color">Color</Label>
                        <Input id="bg-color" type="color" className="p-1 h-10 w-24" value={layer.backgroundColor} onChange={(e) => handleUpdate({ backgroundColor: e.target.value })} onBlur={handleCommit} />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="bg-padding">Padding</Label>
                          <span className="text-sm text-muted-foreground">{layer.padding}px</span>
                        </div>
                        <Slider id="bg-padding" min={0} max={100} step={1} value={[layer.padding || 0]} onValueChange={([v]) => handleUpdate({ padding: v })} onValueCommit={handleCommit} />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="stroke">
                <AccordionTrigger className="py-2 text-sm">Stroke</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stroke-enabled">Enable Stroke</Label>
                    <Switch id="stroke-enabled" checked={!!layer.stroke} onCheckedChange={(c) => handleEffectEnabledChange('stroke', c)} />
                  </div>
                  {layer.stroke && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="stroke-color">Color</Label>
                        <Input id="stroke-color" type="color" className="p-1 h-10 w-24" value={layer.stroke.color} onChange={(e) => handleUpdate({ stroke: { ...layer.stroke!, color: e.target.value } })} onBlur={handleCommit} />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stroke-width">Width</Label>
                          <span className="text-sm text-muted-foreground">{layer.stroke.width}px</span>
                        </div>
                        <Slider id="stroke-width" min={0} max={20} step={0.5} value={[layer.stroke.width]} onValueChange={([v]) => handleUpdate({ stroke: { ...layer.stroke!, width: v } })} onValueCommit={handleCommit} />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shadow">
                <AccordionTrigger className="py-2 text-sm">Shadow</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shadow-enabled">Enable Shadow</Label>
                    <Switch id="shadow-enabled" checked={!!layer.textShadow} onCheckedChange={(c) => handleEffectEnabledChange('textShadow', c)} />
                  </div>
                  {layer.textShadow && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="shadow-color">Color</Label>
                        <Input id="shadow-color" type="color" className="p-1 h-10 w-24" value={layer.textShadow.color} onChange={(e) => handleUpdate({ textShadow: { ...layer.textShadow!, color: e.target.value } })} onBlur={handleCommit} />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="shadow-blur">Blur</Label>
                          <span className="text-sm text-muted-foreground">{layer.textShadow.blur}px</span>
                        </div>
                        <Slider id="shadow-blur" min={0} max={50} step={1} value={[layer.textShadow.blur]} onValueChange={([v]) => handleUpdate({ textShadow: { ...layer.textShadow!, blur: v } })} onValueCommit={handleCommit} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="shadow-offset-x">Offset X</Label>
                            <span className="text-sm text-muted-foreground">{layer.textShadow.offsetX}px</span>
                          </div>
                          <Slider id="shadow-offset-x" min={-50} max={50} step={1} value={[layer.textShadow.offsetX]} onValueChange={([v]) => handleUpdate({ textShadow: { ...layer.textShadow!, offsetX: v } })} onValueCommit={handleCommit} />
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="shadow-offset-y">Offset Y</Label>
                            <span className="text-sm text-muted-foreground">{layer.textShadow.offsetY}px</span>
                          </div>
                          <Slider id="shadow-offset-y" min={-50} max={50} step={1} value={[layer.textShadow.offsetY]} onValueChange={([v]) => handleUpdate({ textShadow: { ...layer.textShadow!, offsetY: v } })} onValueCommit={handleCommit} />
                        </div>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
        
        {/* -------------------------------------------------------------------- */}
        {/* QUICK ACTIONS (Placeholder) */}
        {/* -------------------------------------------------------------------- */}
        <AccordionItem value="quick-actions">
          <AccordionTrigger className="font-semibold">Quick Actions</AccordionTrigger>
          <AccordionContent className="space-y-2">
            <Button variant="outline" className="w-full" disabled>Convert to Frame (Stub)</Button>
            <Button variant="outline" className="w-full" disabled>Convert to Shape (Stub)</Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TextProperties;