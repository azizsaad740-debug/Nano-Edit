"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Layer } from "@/hooks/useEditorState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { TextCharacterPanel } from "./TextCharacterPanel";
import { TextParagraphPanel } from "./TextParagraphPanel";
import { TextEffectsPanel } from "./TextEffectsPanel";

interface TextPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

const defaultFonts = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Playfair Display", "Lobster", "Pacifico"
];

const TextProperties = ({ layer, onUpdate, onCommit, systemFonts, customFonts, onOpenFontManager }: TextPropertiesProps) => {
  if (!layer || layer.type !== 'text') {
    return <p className="text-sm text-muted-foreground">Select a text layer to edit its properties.</p>;
  }

  const availableFonts = React.useMemo(() => {
    return [...new Set([...defaultFonts, ...systemFonts, ...customFonts])].sort();
  }, [systemFonts, customFonts]);

  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const handleCommit = () => {
    onCommit(layer.id);
  };

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

      <Accordion type="multiple" className="w-full" defaultValue={['character', 'paragraph', 'effects']}>
        {/* CHARACTER PANEL */}
        <AccordionItem value="character">
          <AccordionTrigger className="font-semibold">Character</AccordionTrigger>
          <AccordionContent>
            <TextCharacterPanel
              layer={layer}
              onUpdate={handleUpdate}
              onCommit={handleCommit}
              availableFonts={availableFonts}
              onOpenFontManager={onOpenFontManager}
            />
          </AccordionContent>
        </AccordionItem>

        {/* PARAGRAPH PANEL */}
        <AccordionItem value="paragraph">
          <AccordionTrigger className="font-semibold">Paragraph</AccordionTrigger>
          <AccordionContent>
            <TextParagraphPanel
              layer={layer}
              onUpdate={handleUpdate}
              onCommit={handleCommit}
            />
          </AccordionContent>
        </AccordionItem>

        {/* EFFECTS PANEL */}
        <AccordionItem value="effects">
          <AccordionTrigger className="font-semibold">Effects</AccordionTrigger>
          <AccordionContent>
            <TextEffectsPanel
              layer={layer}
              onUpdate={handleUpdate}
              onCommit={handleCommit}
            />
          </AccordionContent>
        </AccordionItem>
        
        {/* ADVANCED TRANSFORMS */}
        <AccordionItem value="advanced-transforms">
          <AccordionTrigger className="font-semibold">Advanced Transforms</AccordionTrigger>
          <AccordionContent className="space-y-4">
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

        {/* QUICK ACTIONS (Placeholder) */}
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