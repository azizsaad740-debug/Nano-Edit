"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify, RotateCcw, Palette, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/color-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Layer, TextLayerData } from "@/types/editor";

interface TextOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

export const TextOptions: React.FC<TextOptionsProps> = ({ layer, onLayerUpdate, onLayerCommit, systemFonts, customFonts, onOpenFontManager }) => {
  if (layer.type !== 'text') return null;

  // Fix: Safely check if fontWeight is 'bold' or its numeric equivalent '700'
  const isBoldActive = layer.fontWeight === 'bold' || layer.fontWeight === 700 || layer.fontWeight === '700';
  const isItalicActive = layer.fontStyle === 'italic';
  
  const handleUpdate = (updates: Partial<TextLayerData>) => {
    onLayerUpdate(updates);
  };

  const handleCommit = (historyName: string) => {
    onLayerCommit(historyName);
  };

  const handleFontChange = (key: keyof TextLayerData, value: any, historyName: string) => {
    handleUpdate({ [key]: value });
    handleCommit(historyName);
  };

  const handleTextShadowChange = (key: 'offsetX' | 'offsetY' | 'blur' | 'color', value: any) => {
    const shadow = layer.textShadow || { offsetX: 0, offsetY: 0, blur: 0, color: '#000000' };
    handleUpdate({ textShadow: { ...shadow, [key]: value } });
  };

  const handleTextShadowCommit = () => {
    handleCommit("Update Text Shadow");
  };

  const handleTextStrokeChange = (key: 'width' | 'color', value: any) => {
    const stroke = layer.stroke || { width: 0, color: '#000000' };
    handleUpdate({ stroke: { ...stroke, [key]: value } });
  };

  const handleTextStrokeCommit = () => {
    handleCommit("Update Text Stroke");
  };

  const allFonts = [...systemFonts, ...customFonts].sort();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Text Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content */}
        <div className="grid gap-2">
          <Label htmlFor="text-content">Content</Label>
          <textarea
            id="text-content"
            value={layer.content}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            onBlur={() => handleCommit("Edit Text Content")}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Font Family */}
        <div className="grid gap-2">
          <Label htmlFor="font-family">Font Family</Label>
          <div className="flex items-center gap-2">
            <Select
              value={layer.fontFamily}
              onValueChange={(value) => handleFontChange('fontFamily', value, `Change Font to ${value}`)}
            >
              <SelectTrigger id="font-family" className="flex-1">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allFonts.map(font => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={onOpenFontManager}>
              <Type className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Size */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size">Size</Label>
            <span className="text-sm text-muted-foreground">{layer.fontSize}px</span>
          </div>
          <Slider
            id="font-size"
            min={8}
            max={200}
            step={1}
            value={[layer.fontSize]}
            onValueChange={([v]) => handleUpdate({ fontSize: v })}
            onValueCommit={([v]) => handleCommit(`Set Font Size to ${v}px`)}
          />
        </div>

        {/* Style and Alignment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Style</Label>
            <ToggleGroup type="multiple" className="justify-start">
              <ToggleGroupItem
                value="bold"
                aria-label="Toggle bold"
                pressed={isBoldActive}
                onClick={() => handleFontChange('fontWeight', isBoldActive ? 'normal' : 'bold', isBoldActive ? 'Remove Bold' : 'Apply Bold')}
              >
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="italic"
                aria-label="Toggle italic"
                pressed={isItalicActive}
                onClick={() => handleFontChange('fontStyle', isItalicActive ? 'normal' : 'italic', isItalicActive ? 'Remove Italic' : 'Apply Italic')}
              >
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid gap-2">
            <Label>Alignment</Label>
            <ToggleGroup type="single" value={layer.textAlign || 'center'} onValueChange={(v) => handleFontChange('textAlign', v, `Align Text ${v}`)}>
              <ToggleGroupItem value="left" aria-label="Align left">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Align center">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Align right">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="justify" aria-label="Align justify">
                <AlignJustify className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Color */}
        <div className="grid gap-2">
          <Label htmlFor="text-color">Text Color</Label>
          <ColorPicker
            color={layer.color}
            onChange={(color) => handleUpdate({ color })}
            onCommit={() => handleCommit("Change Text Color")}
          />
        </div>

        {/* Advanced Options */}
        <Accordion type="multiple" className="w-full pt-2 border-t" defaultValue={['spacing']}>
          <AccordionItem value="spacing">
            <AccordionTrigger>Spacing & Layout</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="letter-spacing">Letter Spacing</Label>
                  <span className="text-sm text-muted-foreground">{layer.letterSpacing}px</span>
                </div>
                <Slider
                  id="letter-spacing"
                  min={-10}
                  max={50}
                  step={0.5}
                  value={[layer.letterSpacing || 0]}
                  onValueChange={([v]) => handleUpdate({ letterSpacing: v })}
                  onValueCommit={([v]) => handleCommit(`Set Letter Spacing to ${v}px`)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="line-height">Line Height</Label>
                  <span className="text-sm text-muted-foreground">x{layer.lineHeight?.toFixed(2)}</span>
                </div>
                <Slider
                  id="line-height"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={[layer.lineHeight || 1.2]}
                  onValueChange={([v]) => handleUpdate({ lineHeight: v })}
                  onValueCommit={([v]) => handleCommit(`Set Line Height to x${v.toFixed(2)}`)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="background-shadow">
            <AccordionTrigger>Background & Shadow</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Background Color */}
              <div className="grid gap-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <ColorPicker
                  color={layer.backgroundColor || '#00000000'}
                  onChange={(color) => handleUpdate({ backgroundColor: color })}
                  onCommit={() => handleCommit("Change Text Background Color")}
                  showAlpha
                />
              </div>
              {/* Padding */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="padding">Padding</Label>
                  <span className="text-sm text-muted-foreground">{layer.padding}px</span>
                </div>
                <Slider
                  id="padding"
                  min={0}
                  max={50}
                  step={1}
                  value={[layer.padding || 0]}
                  onValueChange={([v]) => handleUpdate({ padding: v })}
                  onValueCommit={([v]) => handleCommit(`Set Text Padding to ${v}px`)}
                />
              </div>
              <Separator />
              {/* Text Shadow */}
              <div className="grid gap-2">
                <Label className="font-medium">Text Shadow</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="shadow-x">Offset X</Label>
                    <Slider min={-20} max={20} step={1} value={[layer.textShadow?.offsetX || 0]} onValueChange={([v]) => handleTextShadowChange('offsetX', v)} onValueCommit={handleTextShadowCommit} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shadow-y">Offset Y</Label>
                    <Slider min={-20} max={20} step={1} value={[layer.textShadow?.offsetY || 0]} onValueChange={([v]) => handleTextShadowChange('offsetY', v)} onValueCommit={handleTextShadowCommit} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shadow-blur">Blur</Label>
                  <Slider min={0} max={20} step={1} value={[layer.textShadow?.blur || 0]} onValueChange={([v]) => handleTextShadowChange('blur', v)} onValueCommit={handleTextShadowCommit} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shadow-color">Color</Label>
                  <ColorPicker
                    color={layer.textShadow?.color || '#000000'}
                    onChange={(color) => handleTextShadowChange('color', color)}
                    onCommit={handleTextShadowCommit}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stroke">
            <AccordionTrigger>Stroke (Outline)</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stroke-width">Width</Label>
                  <span className="text-sm text-muted-foreground">{layer.stroke?.width || 0}px</span>
                </div>
                <Slider
                  id="stroke-width"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[layer.stroke?.width || 0]}
                  onValueChange={([v]) => handleTextStrokeChange('width', v)}
                  onValueCommit={handleTextStrokeCommit}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stroke-color">Color</Label>
                <ColorPicker
                  color={layer.stroke?.color || '#000000'}
                  onChange={(color) => handleTextStrokeChange('color', color)}
                  onCommit={handleTextStrokeCommit}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};