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
import type { Layer } from "@/hooks/useEditorState";

interface TextPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
}

const fonts = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Playfair Display", "Lobster", "Pacifico"
];

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
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          value={layer.color || "#FFFFFF"}
          onChange={(e) => handleUpdate({ color: e.target.value })}
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
    </div>
  );
};

export default TextProperties;