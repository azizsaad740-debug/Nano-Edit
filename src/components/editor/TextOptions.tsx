"use client";

import * as React from "react";
import { Layer } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  ChevronDown,
  ChevronUp,
  TextCursor,
  Settings,
  ArrowLeft,
  ArrowRight,
  ArrowDownUp,
  CornerDownLeft,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// Use properties directly from Layer, relying on updated types/editor.ts
type TextAlignment = Layer['textAlign'];
type TextTransform = Layer['textTransform'];
type TextDecoration = Layer['textDecoration'];
type TextWarpData = Layer['textWarp'];


interface TextOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

const TEXT_ALIGNMENTS: { value: TextAlignment; icon: React.ElementType; label: string }[] = [
  { value: 'left', icon: AlignLeft, label: 'Align Left' },
  { value: 'center', icon: AlignCenter, label: 'Align Center' },
  { value: 'right', icon: AlignRight, label: 'Align Right' },
  { value: 'justify', icon: AlignJustify, label: 'Justify' },
];

const TEXT_VERTICAL_ALIGNMENTS: { value: Layer['verticalAlignment']; icon: React.ElementType; label: string }[] = [
  { value: 'top', icon: ChevronUp, label: 'Align Top' },
  { value: 'middle', icon: TextCursor, label: 'Align Middle' },
  { value: 'bottom', icon: ChevronDown, label: 'Align Bottom' },
];

const TEXT_TRANSFORMS: { value: TextTransform; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'All Caps' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

const TEXT_WARP_STYLES: { value: TextWarpData['type']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'arc', label: 'Arc' },
  { value: 'arch', label: 'Arch' },
  { value: 'bulge', label: 'Bulge' },
  { value: 'shell', label: 'Shell' },
  { value: 'wave', label: 'Wave' },
  { value: 'fish', label: 'Fish' },
  { value: 'rise', label: 'Rise' },
  { value: 'fisheye', label: 'Fisheye' },
  { value: 'inflate', label: 'Inflate' },
  { value: 'squeeze', label: 'Squeeze' },
  { value: 'twist', label: 'Twist' },
  { value: 'custom', label: 'Custom' },
];

export const TextOptions: React.FC<TextOptionsProps> = ({
  layer,
  onLayerUpdate,
  onLayerCommit,
  systemFonts,
  customFonts,
  onOpenFontManager,
}) => {
  const allFonts = React.useMemo(() => [...systemFonts, ...customFonts].sort(), [systemFonts, customFonts]);

  const handleCommit = (key: keyof Layer, historyName: string) => {
    onLayerCommit(historyName);
  };

  const handleSelectChange = (key: keyof Layer, value: string | number | boolean, historyName: string) => {
    onLayerUpdate({ [key]: value });
    onLayerCommit(historyName);
  };

  const handleToggleStyle = (key: 'fontWeight' | 'fontStyle', value: 'bold' | 'italic') => {
    const currentValue = layer[key];
    const newValue = currentValue === value ? 'normal' : value;
    onLayerUpdate({ [key]: newValue });
    onLayerCommit(`Toggle ${key} to ${newValue}`);
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
      onLayerUpdate({ [effect]: defaultValues[effect] });
    } else {
      const updates: Partial<Layer> = { [effect]: undefined };
      if (effect === 'backgroundColor') updates.padding = 0;
      onLayerUpdate(updates);
    }
    onLayerCommit(`Toggle Text Effect: ${effect}`);
  };

  const isBoldActive = layer.fontWeight === 'bold' || layer.fontWeight === 700;
  const isItalicActive = layer.fontStyle === 'italic';
  const isUnderlineActive = layer.textDecoration === 'underline';
  const isStrikethroughActive = layer.textDecoration === 'line-through';

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="content">Text Content</Label>
        <Input
          id="content"
          value={layer.content || ""}
          onChange={(e) => onLayerUpdate({ content: e.target.value })}
          onBlur={() => handleCommit('content', "Edit Text Content")}
          className="h-10"
        />
      </div>

      <Accordion type="multiple" className="w-full" defaultValue={['character']}>
        {/* CHARACTER PANEL */}
        <AccordionItem value="character">
          <AccordionTrigger className="font-semibold">Character</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {/* Font Family & Size */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={layer.fontFamily}
                  onValueChange={(value) => handleSelectChange('fontFamily', value, `Change Font to ${value}`)}
                >
                  <SelectTrigger id="fontFamily">
                    <SelectValue placeholder="Select Font" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {allFonts.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <Button variant="ghost" className="w-full justify-start" onClick={onOpenFontManager}>
                      <Settings className="h-4 w-4 mr-2" /> Manage Fonts...
                    </Button>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20 space-y-1">
                <Label htmlFor="fontSize">Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={layer.fontSize}
                  onChange={(e) => onLayerUpdate({ fontSize: parseFloat(e.target.value) || 0 })}
                  onBlur={() => handleCommit('fontSize', `Change Font Size to ${layer.fontSize}`)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Font Weight/Style & Color */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="fontWeight">Weight</Label>
                <Select
                  value={String(layer.fontWeight)}
                  onValueChange={(value) => handleSelectChange('fontWeight', value, `Change Font Weight`)}
                >
                  <SelectTrigger id="fontWeight">
                    <SelectValue placeholder="Select Weight" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHTS.map((weight) => (
                      <SelectItem key={weight.value} value={weight.value}>
                        {weight.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20 space-y-1">
                <Label htmlFor="fillColor">Color</Label>
                <ColorPicker
                  color={layer.color}
                  onChange={(color) => onLayerUpdate({ color: color })}
                  onCommit={() => onLayerCommit('Change Text Color')}
                />
              </div>
            </div>

            <Separator />

            {/* 3. Character Styles (Bold, Italic, Underline, Strikethrough) */}
            <div className="flex items-center justify-between">
              <Label>Styles</Label>
              <ToggleGroup type="multiple" size="sm" value={[
                isBoldActive ? 'bold' : '',
                isItalicActive ? 'italic' : '',
                isUnderlineActive ? 'underline' : '',
                isStrikethroughActive ? 'strikethrough' : '',
              ].filter(Boolean)}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="bold" aria-label="Toggle bold" onClick={() => handleToggleStyle('fontWeight', 'bold')}>
                        <Bold className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="italic" aria-label="Toggle italic" onClick={() => handleToggleStyle('fontStyle', 'italic')}>
                        <Italic className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="underline" aria-label="Toggle underline" onClick={() => handleSelectChange('textDecoration', isUnderlineActive ? 'none' : 'underline', isUnderlineActive ? 'Remove Underline' : 'Apply Underline')}>
                        <Underline className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Underline</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough" onClick={() => handleSelectChange('textDecoration', isStrikethroughActive ? 'none' : 'line-through', isStrikethroughActive ? 'Remove Strikethrough' : 'Apply Strikethrough')}>
                        <Strikethrough className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Strikethrough</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </ToggleGroup>
            </div>

            <Separator />

            {/* Spacing Controls (Leading, Tracking, Kerning, Baseline Shift) */}
            <div className="grid grid-cols-2 gap-2">
              <TextControl 
                icon={ChevronUp} 
                value={layer.lineHeight || 1.2} 
                onChange={(v: number) => onLayerUpdate({ lineHeight: v })}
                onCommit={() => handleCommit('lineHeight', `Change Leading`)}
                unit="x"
                min={0.5}
                max={3.0}
                step={0.1}
                placeholder="1.2"
                label="Leading"
              />
              <TextControl 
                icon={ArrowDownUp} 
                value={layer.letterSpacing || 0} 
                onChange={(v: number) => onLayerUpdate({ letterSpacing: v })}
                onCommit={() => handleCommit('letterSpacing', `Change Tracking`)}
                unit="px"
                min={-10}
                max={50}
                step={0.5}
                placeholder="0"
                label="Tracking"
              />
              <TextControl 
                icon={Type} 
                value={layer.wordSpacing || 0} 
                onChange={(v: number) => onLayerUpdate({ wordSpacing: v })}
                onCommit={() => handleCommit('wordSpacing', `Change Kerning`)}
                unit="px"
                min={-10}
                max={50}
                step={0.5}
                placeholder="0"
                label="Kerning"
              />
              <TextControl 
                icon={TextCursor} 
                value={layer.baselineShift || 0} 
                onChange={(v: number) => onLayerUpdate({ baselineShift: v })}
                onCommit={() => handleCommit('baselineShift', `Change Baseline Shift`)}
                unit="pt"
                min={-50}
                max={50}
                step={1}
                placeholder="0"
                label="Baseline Shift"
              />
            </div>
            
            {/* Scale (V/H) - Stubbed */}
            <div className="grid grid-cols-2 gap-2">
              <TextControl 
                icon={ArrowRight} 
                value={100} 
                onChange={() => {}}
                onCommit={() => {}}
                unit="%"
                placeholder="100"
                disabled
                label="Horizontal Scale (Stub)"
              />
              <TextControl 
                icon={ArrowDownUp} 
                value={100} 
                onChange={() => {}}
                onCommit={() => {}}
                unit="%"
                placeholder="100"
                disabled
                label="Vertical Scale (Stub)"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PARAGRAPH PANEL */}
        <AccordionItem value="paragraph">
          <AccordionTrigger className="font-semibold">Paragraph</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {/* Horizontal Alignment */}
            <div className="space-y-2">
              <Label>Horizontal Alignment</Label>
              <ToggleGroup
                type="single"
                size="sm"
                value={layer.textAlign}
                onValueChange={(value: TextAlignment) => value && handleSelectChange('textAlign', value, `Align Text ${value}`)}
                className="justify-start"
              >
                <TooltipProvider delayDuration={0}>
                  {TEXT_ALIGNMENTS.map(item => (
                    <Tooltip key={item.value}>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value={item.value} aria-label={item.label}>
                          <item.icon className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>{item.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </ToggleGroup>
            </div>
            
            {/* Vertical Alignment (Area Type) */}
            <div className="space-y-2">
              <Label>Vertical Alignment (Area Type)</Label>
              <ToggleGroup
                type="single"
                size="sm"
                value={layer.verticalAlignment}
                onValueChange={(value: Layer['verticalAlignment']) => value && handleSelectChange('verticalAlignment', value, `Vertical Align Text ${value}`)}
                className="justify-start"
              >
                <TooltipProvider delayDuration={0}>
                  {TEXT_VERTICAL_ALIGNMENTS.map(item => (
                    <Tooltip key={item.value}>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value={item.value} aria-label={item.label}>
                          <item.icon className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>{item.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </ToggleGroup>
            </div>

            <Separator />

            {/* Indentation & Spacing (Stubbed) */}
            <div className="grid grid-cols-2 gap-2">
              <TextControl 
                icon={CornerDownLeft} 
                value={layer.indentation || 0} 
                onChange={(v: number) => onLayerUpdate({ indentation: v })}
                onCommit={() => handleCommit('indentation', `Change Indentation`)}
                unit="px"
                disabled
                placeholder="0"
                label="Indentation (Stub)"
              />
              <div className="flex flex-col gap-2">
                <TextControl 
                  icon={ChevronUp} 
                  value={layer.spaceBefore || 0} 
                  onChange={(v: number) => onLayerUpdate({ spaceBefore: v })}
                  onCommit={() => handleCommit('spaceBefore', `Change Space Before`)}
                  unit="px"
                  disabled
                  placeholder="0"
                  label="Space Before (Stub)"
                />
                <TextControl 
                  icon={ChevronDown} 
                  value={layer.spaceAfter || 0} 
                  onChange={(v: number) => onLayerUpdate({ spaceAfter: v })}
                  onCommit={() => handleCommit('spaceAfter', `Change Space After`)}
                  unit="px"
                  disabled
                  placeholder="0"
                  label="Space After (Stub)"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="hyphenate"
                checked={layer.hyphenate}
                onCheckedChange={(checked) => onLayerUpdate({ hyphenate: !!checked })}
                disabled
              />
              <label
                htmlFor="hyphenate"
                className="text-sm font-medium leading-none text-muted-foreground"
              >
                Hyphenate (Stub)
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* EFFECTS & WARPING PANEL */}
        <AccordionItem value="effects">
          <AccordionTrigger className="font-semibold">Effects & Warping</AccordionTrigger>
          <AccordionContent className="space-y-4">
            
            {/* Text Case / Transform */}
            <div className="space-y-1">
              <Label htmlFor="textTransform">Text Case</Label>
              <Select
                value={layer.textTransform}
                onValueChange={(value: TextTransform) => handleSelectChange('textTransform', value, `Change Text Case`)}
              >
                <SelectTrigger id="textTransform">
                  <SelectValue placeholder="Normal" />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_TRANSFORMS.map(item => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Background */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bg-enabled">Background</Label>
                <div className="flex items-center space-x-2">
                  <Input id="bg-color" type="color" className="p-1 h-8 w-8" value={layer.backgroundColor || '#000000'} onChange={(e) => onLayerUpdate({ backgroundColor: e.target.value })} onBlur={() => handleEffectEnabledChange('backgroundColor', !!layer.backgroundColor)} />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEffectEnabledChange('backgroundColor', !layer.backgroundColor)}>
                    <RotateCcw className={cn("h-3 w-3", !layer.backgroundColor && "opacity-30")} />
                  </Button>
                </div>
              </div>
              {layer.backgroundColor && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bg-padding">Padding</Label>
                    <span className="text-sm text-muted-foreground">{layer.padding}px</span>
                  </div>
                  <Slider id="bg-padding" min={0} max={100} step={1} value={[layer.padding || 0]} onValueChange={([v]) => onLayerUpdate({ padding: v })} onValueCommit={() => handleCommit('padding', 'Change Text Padding')} />
                </div>
              )}
            </div>

            <Separator />

            {/* Stroke */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="stroke-enabled">Stroke</Label>
                <div className="flex items-center space-x-2">
                  <Input id="stroke-color" type="color" className="p-1 h-8 w-8" value={layer.stroke?.color || '#000000'} onChange={(e) => onLayerUpdate({ stroke: { ...layer.stroke!, color: e.target.value } })} onBlur={() => handleEffectEnabledChange('stroke', !!layer.stroke)} />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEffectEnabledChange('stroke', !layer.stroke)}>
                    <RotateCcw className={cn("h-3 w-3", !layer.stroke && "opacity-30")} />
                  </Button>
                </div>
              </div>
              {layer.stroke && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stroke-width">Width</Label>
                    <span className="text-sm text-muted-foreground">{layer.stroke.width}px</span>
                  </div>
                  <Slider id="stroke-width" min={0} max={20} step={0.5} value={[layer.stroke.width]} onValueChange={([v]) => onLayerUpdate({ stroke: { ...layer.stroke!, width: v } })} onValueCommit={() => handleCommit('stroke', 'Change Text Stroke Width')} />
                </div>
              )}
            </div>

            <Separator />

            {/* Shadow */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shadow-enabled">Shadow</Label>
                <div className="flex items-center space-x-2">
                  <Input id="shadow-color" type="color" className="p-1 h-8 w-8" value={layer.textShadow?.color || '#000000'} onChange={(e) => onLayerUpdate({ textShadow: { ...layer.textShadow!, color: e.target.value } })} onBlur={() => handleEffectEnabledChange('textShadow', !!layer.textShadow)} />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEffectEnabledChange('textShadow', !layer.textShadow)}>
                    <RotateCcw className={cn("h-3 w-3", !layer.textShadow && "opacity-30")} />
                  </Button>
                </div>
              </div>
              {layer.textShadow && (
                <>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shadow-blur">Blur</Label>
                      <span className="text-sm text-muted-foreground">{layer.textShadow.blur}px</span>
                    </div>
                    <Slider id="shadow-blur" min={0} max={50} step={1} value={[layer.textShadow.blur]} onValueChange={([v]) => onLayerUpdate({ textShadow: { ...layer.textShadow!, blur: v } })} onValueCommit={() => handleCommit('textShadow', 'Change Text Shadow Blur')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="shadow-offset-x">Offset X</Label>
                        <span className="text-sm text-muted-foreground">{layer.textShadow.offsetX}px</span>
                      </div>
                      <Slider id="shadow-offset-x" min={-50} max={50} step={1} value={[layer.textShadow.offsetX]} onValueChange={([v]) => onLayerUpdate({ textShadow: { ...layer.textShadow!, offsetX: v } })} onValueCommit={() => handleCommit('textShadow', 'Change Text Shadow Offset X')} />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="shadow-offset-y">Offset Y</Label>
                        <span className="text-sm text-muted-foreground">{layer.textShadow.offsetY}px</span>
                      </div>
                      <Slider id="shadow-offset-y" min={-50} max={50} step={1} value={[layer.textShadow.offsetY]} onValueChange={([v]) => onLayerUpdate({ textShadow: { ...layer.textShadow!, offsetY: v } })} onValueCommit={() => handleCommit('textShadow', 'Change Text Shadow Offset Y')} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Text Warping */}
            <div className="space-y-1">
              <Label htmlFor="textWarpType">Text Warping Style</Label>
              <Select
                value={layer.textWarp?.type}
                onValueChange={(value: TextWarpData['type']) => onLayerUpdate({ textWarp: { ...layer.textWarp, type: value } })}
              >
                <SelectTrigger id="textWarpType">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TEXT_WARP_STYLES.map(item => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {layer.textWarp?.type !== 'none' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Bend ({layer.textWarp.bend}%)</Label>
                  <Slider
                    min={-100}
                    max={100}
                    step={1}
                    value={[layer.textWarp.bend]}
                    onValueChange={([value]) => onLayerUpdate({ textWarp: { ...layer.textWarp, bend: value } })}
                    onValueCommit={() => onLayerCommit(`Change Text Warp Bend`)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>H Distortion ({layer.textWarp.horizontalDistortion || 0}%)</Label>
                    <Slider
                      min={-100}
                      max={100}
                      step={1}
                      value={[layer.textWarp.horizontalDistortion || 0]}
                      onValueChange={([value]) => onLayerUpdate({ textWarp: { ...layer.textWarp, horizontalDistortion: value } })}
                      onValueCommit={() => onLayerCommit(`Change Text Warp H Distortion`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>V Distortion ({layer.textWarp.verticalDistortion || 0}%)</Label>
                    <Slider
                      min={-100}
                      max={100}
                      step={1}
                      value={[layer.textWarp.verticalDistortion || 0]}
                      onValueChange={([value]) => onLayerUpdate({ textWarp: { ...layer.textWarp, verticalDistortion: value } })}
                      onValueCommit={() => onLayerCommit(`Change Text Warp V Distortion`)}
                    />
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* OpenType Features (Placeholder) */}
            <div className="space-y-2">
              <Label className="font-semibold">OpenType Features (Stub)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ligatures"
                    checked={layer.openTypeFeatures?.ligatures}
                    onCheckedChange={(checked) => onLayerUpdate({ openTypeFeatures: { ...layer.openTypeFeatures, ligatures: !!checked } })}
                  />
                  <label htmlFor="ligatures" className="text-sm font-medium leading-none">Ligatures</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="swashes"
                    checked={layer.openTypeFeatures?.swashes}
                    onCheckedChange={(checked) => onLayerUpdate({ openTypeFeatures: { ...layer.openTypeFeatures, swashes: !!checked } })}
                  />
                  <label htmlFor="swashes" className="text-sm font-medium leading-none">Swashes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fractions"
                    checked={layer.openTypeFeatures?.fractions}
                    onCheckedChange={(checked) => onLayerUpdate({ openTypeFeatures: { ...layer.openTypeFeatures, fractions: !!checked } })}
                  />
                  <label htmlFor="fractions" className="text-sm font-medium leading-none">Fractions</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stylisticSet"
                    checked={layer.openTypeFeatures?.stylisticSet > 0}
                    onCheckedChange={(checked) => onLayerUpdate({ openTypeFeatures: { ...layer.openTypeFeatures, stylisticSet: checked ? 1 : 0 } })}
                  />
                  <label htmlFor="stylisticSet" className="text-sm font-medium leading-none">Stylistic Sets</label>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// Helper component for icon buttons with text/value inputs (defined outside for reuse)
const TextControl = ({ icon: Icon, value, onChange, onCommit, unit = 'pt', min = 0, max = 100, step = 1, placeholder = '0', disabled = false, label }: any) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center border rounded-md h-8">
          <Button variant="ghost" size="icon" className="h-full w-8 p-1 shrink-0" disabled={disabled}>
            <Icon className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e)}
            onBlur={onCommit}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            className="h-full flex-1 border-y-0 border-x border-input rounded-none text-xs text-center p-0"
            disabled={disabled}
          />
          <span className="text-xs text-muted-foreground px-1.5 shrink-0">{unit}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);