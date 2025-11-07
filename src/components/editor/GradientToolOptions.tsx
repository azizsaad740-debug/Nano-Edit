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
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { GradientToolState, GradientLayerData } from "@/types/editor";
import type { GradientPreset } from "@/hooks/useGradientPresets";
import GradientPresets from "./GradientPresets";
import { SaveGradientPresetDialog } from "./SaveGradientPresetDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GradientToolOptionsProps {
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  gradientPresets: GradientPreset[];
  onApplyGradientPreset: (preset: GradientPreset) => void;
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
}

export const GradientToolOptions = ({ 
  gradientToolState, 
  setGradientToolState,
  gradientPresets,
  onApplyGradientPreset,
  onSaveGradientPreset,
  onDeleteGradientPreset,
}: GradientToolOptionsProps) => {
  const [isSavingGradientPreset, setIsSavingGradientPreset] = React.useState(false);

  const handleUpdate = (updates: Partial<GradientToolState>) => {
    setGradientToolState(prev => ({ ...prev, ...updates }));
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...(gradientToolState.colors || [])];
    newColors[index] = newColor;
    handleUpdate({ colors: newColors });
  };

  const handleStopChange = (index: number, newStop: number) => {
    const newStops = [...(gradientToolState.stops || [])];
    newStops[index] = newStop / 100; // Convert to 0-1 range
    handleUpdate({ stops: newStops });
  };

  const handleAddColor = () => {
    const newColors = [...(gradientToolState.colors || ["#FFFFFF", "#000000"])];
    const newStops = [...(gradientToolState.stops || [0, 1])];
    
    // Add a new color in the middle
    newColors.splice(newColors.length - 1, 0, "#808080"); // Grey color
    newStops.splice(newStops.length - 1, 0, 0.5); // Middle stop
    
    handleUpdate({ colors: newColors, stops: newStops });
  };

  const handleRemoveColor = (index: number) => {
    if ((gradientToolState.colors?.length || 0) <= 2) return; // Must have at least two colors
    const newColors = (gradientToolState.colors || []).filter((_, i) => i !== index);
    const newStops = (gradientToolState.stops || []).filter((_, i) => i !== index);
    handleUpdate({ colors: newColors, stops: newStops });
  };

  const handleResetFeather = () => {
    handleUpdate({ feather: 0 });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold">New Gradient Defaults</h3>

      <Accordion type="multiple" className="w-full" defaultValue={['presets', 'gradient-settings']}>
        <AccordionItem value="presets">
          <AccordionTrigger>Presets</AccordionTrigger>
          <AccordionContent>
            <GradientPresets
              gradientPresets={gradientPresets}
              onApplyGradientPreset={(preset) => setGradientToolState(preset.state)}
              onSaveGradientPreset={() => setIsSavingGradientPreset(true)}
              onDeleteGradientPreset={onDeleteGradientPreset}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="gradient-settings">
          <AccordionTrigger>Settings</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="gradient-type">Gradient Type</Label>
              <Select
                value={gradientToolState.type}
                onValueChange={(v) => handleUpdate({ type: v as GradientToolState['type'] })}
              >
                <SelectTrigger id="gradient-type">
                  <SelectValue placeholder="Select gradient type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="angle">Angle (Stub)</SelectItem>
                  <SelectItem value="reflected">Reflected (Stub)</SelectItem>
                  <SelectItem value="diamond">Diamond (Stub)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Colors & Stops</Label>
              <div className="flex flex-col gap-2">
                {(gradientToolState.colors || ["#FFFFFF", "#000000"]).map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="color"
                      className="p-1 h-10 w-12"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                    />
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[((gradientToolState.stops?.[index] ?? index / ((gradientToolState.colors?.length || 1) - 1)) * 100)]}
                      onValueChange={([v]) => handleStopChange(index, v)}
                      className="flex-1"
                    />
                    <span className="w-10 text-right text-sm text-muted-foreground">{Math.round((gradientToolState.stops?.[index] ?? index / ((gradientToolState.colors?.length || 1) - 1)) * 100)}%</span>
                    {index > 0 && index < (gradientToolState.colors?.length || 0) - 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveColor(index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddColor} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" /> Add Color Stop
                </Button>
              </div>
            </div>

            {gradientToolState.type === 'linear' && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gradient-angle">Angle</Label>
                  <span className="w-10 text-right text-sm text-muted-foreground">{gradientToolState.angle}°</span>
                </div>
                <Slider
                  id="gradient-angle"
                  min={0}
                  max={360}
                  step={1}
                  value={[gradientToolState.angle || 90]}
                  onValueChange={([v]) => handleUpdate({ angle: v })}
                />
              </div>
            )}

            {gradientToolState.type === 'radial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gradient-center-x">Center X</Label>
                      <span className="text-sm text-muted-foreground">{gradientToolState.centerX}%</span>
                    </div>
                    <Slider
                      id="gradient-center-x"
                      min={0}
                      max={100}
                      step={1}
                      value={[gradientToolState.centerX || 50]}
                      onValueChange={([v]) => handleUpdate({ centerX: v })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gradient-center-y">Center Y</Label>
                      <span className="text-sm text-muted-foreground">{gradientToolState.centerY}%</span>
                    </div>
                    <Slider
                      id="gradient-center-y"
                      min={0}
                      max={100}
                      step={1}
                      value={[gradientToolState.centerY || 50]}
                      onValueChange={([v]) => handleUpdate({ centerY: v })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gradient-radius">Radius</Label>
                    <span className="text-sm text-muted-foreground">{gradientToolState.radius}%</span>
                  </div>
                  <Slider
                    id="gradient-radius"
                    min={0}
                    max={100}
                    step={1}
                    value={[gradientToolState.radius || 50]}
                    onValueChange={([v]) => handleUpdate({ radius: v })}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="gradient-dither">Dither (Stub)</Label>
              <Switch
                id="gradient-dither"
                checked={gradientToolState.dither}
                onCheckedChange={(c) => handleUpdate({ dither: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="gradient-transparency">Transparency</Label>
              <Switch
                id="gradient-transparency"
                checked={gradientToolState.transparency}
                onCheckedChange={(c) => handleUpdate({ transparency: c })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="gradient-inverted">Invert</Label>
              <Switch
                id="gradient-inverted"
                checked={gradientToolState.inverted}
                onCheckedChange={(c) => handleUpdate({ inverted: c })}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gradient-feather">Feather</Label>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right text-sm text-muted-foreground">{gradientToolState.feather}%</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleResetFeather}>
                    <RotateCcw className="h-3 w-3" />
                    <span className="sr-only">Reset Feather</span>
                  </Button>
                </div>
              </div>
              <Slider
                id="gradient-feather"
                min={0}
                max={100}
                step={1}
                value={[gradientToolState.feather || 0]}
                onValueChange={([v]) => handleUpdate({ feather: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <SaveGradientPresetDialog
        open={isSavingGradientPreset}
        onOpenChange={setIsSavingGradientPreset}
        onSave={(name) => onSaveGradientPreset(name, gradientToolState)}
      />
    </div>
  );
};