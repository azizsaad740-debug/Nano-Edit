import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Globe } from 'lucide-react';
import type { TextLayerData } from '@/types/editor';
import { showError } from '@/utils/toast';

interface TextOptionsProps {
  layer: TextLayerData;
  onLayerUpdate: (updates: Partial<TextLayerData>) => void;
  onLayerCommit: (historyName: string) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

export const TextOptions: React.FC<TextOptionsProps> = ({ layer, onLayerUpdate, onLayerCommit, systemFonts, customFonts, onOpenFontManager }) => {
  const allFonts = [...systemFonts, ...customFonts].sort();

  const handleUpdate = (updates: Partial<TextLayerData>) => {
    onLayerUpdate(updates);
  };

  const handleCommit = (name: string) => {
    onLayerCommit(name);
  };

  const handleTextShadowChange = useCallback((key: keyof NonNullable<TextLayerData['textShadow']>, value: string | number) => {
    const currentShadow = layer.textShadow || { color: '#000000', blur: 0, offsetX: 0, offsetY: 0 };
    handleUpdate({ textShadow: { ...currentShadow, [key]: value } });
  }, [layer.textShadow, handleUpdate]);

  const handleTextShadowCommit = useCallback(() => {
    handleCommit("Change Text Shadow");
  }, [handleCommit]);

  const handleTextStrokeChange = useCallback((key: keyof NonNullable<TextLayerData['stroke']>, value: string | number) => {
    const currentStroke = layer.stroke || { color: layer.color, width: 0 };
    handleUpdate({ stroke: { ...currentStroke, [key]: value } });
  }, [layer.stroke, layer.color, handleUpdate]);

  const handleTextStrokeCommit = useCallback(() => {
    handleCommit("Change Text Stroke");
  }, [handleCommit]);

  return (
    <div className="grid gap-4">
      {/* Font Family */}
      <div className="grid gap-2">
        <Label htmlFor="font-family">Font</Label>
        <div className="flex items-center gap-2">
          <Select
            value={layer.fontFamily}
            onValueChange={(v) => {
              handleUpdate({ fontFamily: v });
              handleCommit(`Change Font to ${v}`);
            }}
          >
            <SelectTrigger id="font-family" className="flex-1">
              <SelectValue placeholder="Select Font" />
            </SelectTrigger>
            <SelectContent>
              {allFonts.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={onOpenFontManager}>
            <Globe className="h-4 w-4" />
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
          min={10}
          max={200}
          step={1}
          value={[layer.fontSize]}
          onValueChange={([v]) => handleUpdate({ fontSize: v })}
          onValueCommit={() => handleCommit("Change Font Size")}
        />
      </div>

      {/* Color */}
      <div className="grid gap-2">
        <Label htmlFor="font-color">Color</Label>
        <Input
          id="font-color"
          type="color"
          className="p-1 h-10 w-12"
          value={layer.color}
          onChange={(e) => handleUpdate({ color: e.target.value })}
          onBlur={() => handleCommit("Change Font Color")}
        />
      </div>

      {/* Style Toggles */}
      <div className="grid gap-2">
        <Label>Style</Label>
        <ToggleGroup type="multiple" value={[]} className="justify-start">
          <ToggleGroupItem
            value="bold"
            aria-label="Toggle bold"
            onClick={() => {
              const newWeight = layer.fontWeight === 'bold' ? 'normal' : 'bold';
              handleUpdate({ fontWeight: newWeight });
              handleCommit(`Toggle Bold: ${newWeight}`);
            }}
            data-state={layer.fontWeight === 'bold' ? 'on' : 'off'}
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Toggle italic"
            onClick={() => {
              const newStyle = layer.fontStyle === 'italic' ? 'normal' : 'italic';
              handleUpdate({ fontStyle: newStyle });
              handleCommit(`Toggle Italic: ${newStyle}`);
            }}
            data-state={layer.fontStyle === 'italic' ? 'on' : 'off'}
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            aria-label="Toggle underline (Stub)"
            onClick={() => showError("Underline is a stub.")}
          >
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Alignment */}
      <div className="grid gap-2">
        <Label>Alignment</Label>
        <ToggleGroup
          type="single"
          value={layer.textAlign}
          onValueChange={(v) => {
            if (v) {
              handleUpdate({ textAlign: v as TextLayerData['textAlign'] });
              handleCommit(`Change Alignment to ${v}`);
            }
          }}
          className="justify-start"
        >
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

      {/* Line Height & Letter Spacing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="line-height">Line Height</Label>
            <span className="text-sm text-muted-foreground">{layer.lineHeight?.toFixed(2)}</span>
          </div>
          <Slider
            id="line-height"
            min={0.5}
            max={3}
            step={0.05}
            value={[layer.lineHeight || 1.2]}
            onValueChange={([v]) => handleUpdate({ lineHeight: v })}
            onValueCommit={() => handleCommit("Change Line Height")}
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
            max={10}
            step={0.1}
            value={[layer.letterSpacing || 0]}
            onValueChange={([v]) => handleUpdate({ letterSpacing: v })}
            onValueCommit={() => handleCommit("Change Letter Spacing")}
          />
        </div>
      </div>

      {/* Text Shadow Controls */}
      <div className="grid gap-2 pt-4 border-t">
        <Label>Text Shadow</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <Label htmlFor="shadow-x">Offset X ({layer.textShadow?.offsetX || 0}px)</Label>
            <Slider min={-20} max={20} step={1} value={[layer.textShadow?.offsetX || 0]} onValueChange={([v]) => handleTextShadowChange('offsetX', v)} onValueCommit={handleTextShadowCommit} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="shadow-y">Offset Y ({layer.textShadow?.offsetY || 0}px)</Label>
            <Slider min={-20} max={20} step={1} value={[layer.textShadow?.offsetY || 0]} onValueChange={([v]) => handleTextShadowChange('offsetY', v)} onValueCommit={handleTextShadowCommit} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <Label htmlFor="shadow-blur">Blur ({layer.textShadow?.blur || 0}px)</Label>
            <Slider min={0} max={20} step={1} value={[layer.textShadow?.blur || 0]} onValueChange={([v]) => handleTextShadowChange('blur', v)} onValueCommit={handleTextShadowCommit} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="shadow-color">Color</Label>
            <Input
              id="shadow-color"
              type="color"
              className="p-1 h-10 w-12"
              value={layer.textShadow?.color || '#000000'}
              onChange={(e) => handleTextShadowChange('color', e.target.value)}
              onBlur={handleTextShadowCommit}
            />
          </div>
        </div>
      </div>
      
      {/* Text Stroke Controls */}
      <div className="grid gap-2 pt-4 border-t">
        <Label>Text Stroke (Webkit Only)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <Label htmlFor="stroke-width">Width ({layer.stroke?.width || 0}px)</Label>
            <Slider min={0} max={5} step={0.1} value={[layer.stroke?.width || 0]} onValueChange={([v]) => handleTextStrokeChange('width', v)} onValueCommit={handleTextStrokeCommit} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="stroke-color">Color</Label>
            <Input
              id="stroke-color"
              type="color"
              className="p-1 h-10 w-12"
              value={layer.stroke?.color || layer.color}
              onChange={(e) => handleTextStrokeChange('color', e.target.value)}
              onBlur={handleTextStrokeCommit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};