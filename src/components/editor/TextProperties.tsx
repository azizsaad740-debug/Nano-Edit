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
    </div>
  );
};

export default TextProperties;