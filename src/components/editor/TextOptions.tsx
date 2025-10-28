"use client";

import * as React from "react";
import { Layer, TextLayerData, TextAlignment, TextTransform, TextDecoration, TextWarpData } from "@/types/editor";
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
  Columns,
  TextCursorInput,
  TextCursor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TextOptionsProps {
  layer: Layer & TextLayerData;
  onLayerUpdate: (updates: Partial<TextLayerData>) => void;
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

const TEXT_VERTICAL_ALIGNMENTS: { value: TextLayerData['verticalAlignment']; icon: React.ElementType; label: string }[] = [
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

  const handleNumericChange = (key: keyof TextLayerData, value: string, historyName: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onLayerUpdate({ [key]: numValue } as Partial<TextLayerData>);
      // Debounce commit or commit on blur/enter
    }
  };

  const handleCommit = (key: keyof TextLayerData, historyName: string) => {
    onLayerCommit(historyName);
  };

  const handleSelectChange = (key: keyof TextLayerData, value: string, historyName: string) => {
    onLayerUpdate({ [key]: value } as Partial<TextLayerData>);
    onLayerCommit(historyName);
  };

  const handleToggleStyle = (key: 'fontWeight' | 'fontStyle' | 'textDecoration', value: string) => {
    let updates: Partial<TextLayerData> = {};
    let historyName = '';

    if (key === 'fontWeight') {
      const isBold = layer.fontWeight === 'bold' || layer.fontWeight === 700;
      updates.fontWeight = isBold ? 'normal' : 'bold';
      historyName = isBold ? 'Remove Bold' : 'Apply Bold';
    } else if (key === 'fontStyle') {
      const isItalic = layer.fontStyle === 'italic';
      updates.fontStyle = isItalic ? 'normal' : 'italic';
      historyName = isItalic ? 'Remove Italic' : 'Apply Italic';
    } else if (key === 'textDecoration') {
      const isUnderline = layer.textDecoration === 'underline';
      updates.textDecoration = isUnderline ? 'none' : 'underline';
      historyName = isUnderline ? 'Remove Underline' : 'Apply Underline';
    }

    onLayerUpdate(updates);
    onLayerCommit(historyName);
  };

  const isBoldActive = layer.fontWeight === 'bold' || layer.fontWeight === 700;
  const isItalicActive = layer.fontStyle === 'italic';
  const isUnderlineActive = layer.textDecoration === 'underline';
  const isStrikethroughActive = layer.textDecoration === 'line-through';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Text Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Font Family & Size */}
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
                  Manage Fonts...
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

        {/* 2. Font Weight/Style & Color */}
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
              color={layer.fillColor}
              onChange={(color) => onLayerUpdate({ fillColor: color })}
              onCommit={() => onLayerCommit('Change Text Color')}
            />
          </div>
        </div>

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

        {/* 4. Spacing (Leading/Line Height, Tracking/Letter Spacing) */}
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="lineHeight">Leading (Line Height)</Label>
              <Input
                id="lineHeight"
                type="number"
                step="0.1"
                value={layer.lineHeight}
                onChange={(e) => onLayerUpdate({ lineHeight: parseFloat(e.target.value) || 0 })}
                onBlur={() => handleCommit('lineHeight', `Change Leading to ${layer.lineHeight}`)}
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="letterSpacing">Tracking (Letter Spacing)</Label>
              <Input
                id="letterSpacing"
                type="number"
                step="0.1"
                value={layer.letterSpacing}
                onChange={(e) => onLayerUpdate({ letterSpacing: parseFloat(e.target.value) || 0 })}
                onBlur={() => handleCommit('letterSpacing', `Change Tracking to ${layer.letterSpacing}`)}
                className="h-9"
              />
            </div>
          </div>
          
          {/* Baseline Shift & Kerning (Word Spacing) */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="baselineShift">Baseline Shift</Label>
              <Input
                id="baselineShift"
                type="number"
                step="1"
                value={layer.baselineShift}
                onChange={(e) => onLayerUpdate({ baselineShift: parseFloat(e.target.value) || 0 })}
                onBlur={() => handleCommit('baselineShift', `Change Baseline Shift`)}
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="wordSpacing">Kerning (Word Spacing)</Label>
              <Input
                id="wordSpacing"
                type="number"
                step="1"
                value={layer.wordSpacing}
                onChange={(e) => onLayerUpdate({ wordSpacing: parseFloat(e.target.value) || 0 })}
                onBlur={() => handleCommit('wordSpacing', `Change Kerning`)}
                className="h-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* 5. Alignment */}
        <div className="space-y-3">
          <Label>Paragraph Alignment</Label>
          <ToggleGroup
            type="single"
            size="sm"
            value={layer.textAlignment}
            onValueChange={(value: TextAlignment) => value && handleSelectChange('textAlignment', value, `Align Text ${value}`)}
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
          
          <Label className="mt-3 block">Vertical Alignment (Area Type)</Label>
          <ToggleGroup
            type="single"
            size="sm"
            value={layer.verticalAlignment}
            onValueChange={(value: TextLayerData['verticalAlignment']) => value && handleSelectChange('verticalAlignment', value, `Vertical Align Text ${value}`)}
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

        {/* 6. Advanced/Complex Features (Placeholders) */}
        <div className="space-y-4">
          <Label className="font-semibold">Advanced Typography</Label>
          
          {/* Text Transform (All Caps, etc.) */}
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

          {/* Text Warping */}
          <div className="space-y-1">
            <Label htmlFor="textWarpType">Text Warping Style</Label>
            <Select
              value={layer.textWarp.type}
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

          {layer.textWarp.type !== 'none' && (
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
              {/* Placeholder for other warp controls (Distortion, Custom Path) */}
            </div>
          )}

          {/* OpenType Features (Placeholder) */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ligatures"
              checked={layer.openTypeFeatures.ligatures}
              onCheckedChange={(checked) => onLayerUpdate({ openTypeFeatures: { ...layer.openTypeFeatures, ligatures: !!checked } })}
            />
            <label
              htmlFor="ligatures"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use Ligatures
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};