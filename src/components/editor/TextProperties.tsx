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
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

interface TextPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
}

const fonts = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Playfair Display", "Lobster", "Pacifico"
];

const colorPalette = ["#FFFFFF", "#000000", "#EF4444", "#3B82F6", "#22C55E", "#F97316", "#EAB308"];

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
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="font-family">Font</Label>
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
        <div className="grid gap-2">
          <Label>Style</Label>
          <ToggleGroup type="multiple" value={currentStyles} onValueChange={handleStyleChange}>
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Alignment</Label>
        <ToggleGroup type="single" value={layer.textAlign || 'center'} onValueChange={handleAlignChange}>
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="font-size">Font Size</Label>
          <span className="text-sm text-muted-foreground">{layer.fontSize}px</span>
        </div>
        <Slider
          id="font-size"
          min={8}
          max={256}
          step={1}
          value={[layer.fontSize || 48]}
          onValueChange={([v]) => handleUpdate({ fontSize: v })}
          onValueCommit={handleCommit}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="letter-spacing">Letter Spacing</Label>
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
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="color"
            type="color"
            className="p-1 h-10 w-12"
            value={layer.color || "#FFFFFF"}
            onChange={(e) => handleUpdate({ color: e.target.value })}
            onBlur={handleCommit}
          />
          <div className="flex flex-wrap gap-1.5">
            {colorPalette.map(color => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                  layer.color?.toLowerCase() === color.toLowerCase() ? 'border-primary' : 'border-muted'
                )}
                style={{ backgroundColor: color }}
                onClick={() => {
                  handleUpdate({ color });
                  handleCommit();
                }}
              />
            ))}
          </div>
        </div>
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

      <Accordion type="multiple" className="w-full pt-2 border-t">
        <AccordionItem value="background">
          <AccordionTrigger>Background</AccordionTrigger>
          <AccordionContent className="space-y-4">
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
          <AccordionTrigger>Stroke</AccordionTrigger>
          <AccordionContent className="space-y-4">
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
          <AccordionTrigger>Shadow</AccordionTrigger>
          <AccordionContent className="space-y-4">
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
    </div>
  );
};

export default TextProperties;