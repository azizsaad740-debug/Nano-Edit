"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import type { Layer } from "@/types/editor";

interface TextEffectsPanelProps {
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
  onCommit: () => void;
}

export const TextEffectsPanel = ({ layer, onUpdate, onCommit }: TextEffectsPanelProps) => {
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
      onUpdate({ [effect]: defaultValues[effect] });
    } else {
      const updates: Partial<Layer> = { [effect]: undefined };
      if (effect === 'backgroundColor') updates.padding = 0; // Reset padding if background is removed
      onUpdate(updates);
    }
    onCommit();
  };

  return (
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
                <Input id="bg-color" type="color" className="p-1 h-10 w-24" value={layer.backgroundColor} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} onBlur={onCommit} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bg-padding">Padding</Label>
                  <span className="text-sm text-muted-foreground">{layer.padding}px</span>
                </div>
                <Slider id="bg-padding" min={0} max={100} step={1} value={[layer.padding || 0]} onValueChange={([v]) => onUpdate({ padding: v })} onValueCommit={onCommit} />
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
                <Input id="stroke-color" type="color" className="p-1 h-10 w-24" value={layer.stroke.color} onChange={(e) => onUpdate({ stroke: { ...layer.stroke!, color: e.target.value } })} onBlur={onCommit} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stroke-width">Width</Label>
                  <span className="text-sm text-muted-foreground">{layer.stroke.width}px</span>
                </div>
                <Slider id="stroke-width" min={0} max={20} step={0.5} value={[layer.stroke.width]} onValueChange={([v]) => onUpdate({ stroke: { ...layer.stroke!, width: v } })} onValueCommit={onCommit} />
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
                <Input id="shadow-color" type="color" className="p-1 h-10 w-24" value={layer.textShadow.color} onChange={(e) => onUpdate({ textShadow: { ...layer.textShadow!, color: e.target.value } })} onBlur={onCommit} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow-blur">Blur</Label>
                  <span className="text-sm text-muted-foreground">{layer.textShadow.blur}px</span>
                </div>
                <Slider id="shadow-blur" min={0} max={50} step={1} value={[layer.textShadow.blur]} onValueChange={([v]) => onUpdate({ textShadow: { ...layer.textShadow!, blur: v } })} onValueCommit={onCommit} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shadow-offset-x">Offset X</Label>
                    <span className="text-sm text-muted-foreground">{layer.textShadow.offsetX}px</span>
                  </div>
                  <Slider id="shadow-offset-x" min={-50} max={50} step={1} value={[layer.textShadow.offsetX]} onValueChange={([v]) => onUpdate({ textShadow: { ...layer.textShadow!, offsetX: v } })} onValueCommit={onCommit} />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shadow-offset-y">Offset Y</Label>
                    <span className="text-sm text-muted-foreground">{layer.textShadow.offsetY}px</span>
                  </div>
                  <Slider id="shadow-offset-y" min={-50} max={50} step={1} value={[layer.textShadow.offsetY]} onValueChange={([v]) => onUpdate({ textShadow: { ...layer.textShadow!, offsetY: v } })} onValueCommit={onCommit} />
                </div>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};