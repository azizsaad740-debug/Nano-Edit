import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { ActiveTool, SelectionSettings } from '@/types/editor';

interface SelectionToolOptionsProps {
  activeTool: ActiveTool | null;
  settings: SelectionSettings;
  handleCheckboxChange: (key: keyof SelectionSettings, value: boolean) => void;
  handleValueChange: (key: keyof SelectionSettings, value: number) => void;
  handleValueCommit: (key: keyof SelectionSettings, value: number) => void;
}

export const SelectionToolOptions: React.FC<SelectionToolOptionsProps> = ({ activeTool, settings, handleCheckboxChange, handleValueChange, handleValueCommit }) => {
  
  const isMarqueeTool = activeTool === 'marqueeRect' || activeTool === 'marqueeEllipse';
  const isLassoTool = activeTool === 'lasso' || activeTool === 'lassoPoly' || activeTool === 'lassoMagnetic';
  const isMagicWandTool = activeTool === 'magicWand' || activeTool === 'quickSelect';
  
  const handleSliderChange = (key: keyof SelectionSettings, value: number) => {
    handleValueChange(key, value);
  };
  
  const handleSliderCommit = (key: keyof SelectionSettings, value: number) => {
    handleValueCommit(key, value);
  };
  
  const handleInputNumberChange = (key: keyof SelectionSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    handleValueChange(key, value);
  };
  
  const handleInputNumberCommit = (key: keyof SelectionSettings, e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    handleValueCommit(key, value);
  };

  return (
    <div className="grid gap-4">
      {/* Selection Mode (Applies to all selection tools) */}
      <div className="grid gap-2">
        <Label htmlFor="selection-mode">Mode</Label>
        <Select
          value={settings.selectionMode}
          onValueChange={(v) => handleCheckboxChange('selectionMode', v as any)}
        >
          <SelectTrigger id="selection-mode">
            <SelectValue placeholder="New Selection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New Selection</SelectItem>
            <SelectItem value="add">Add to Selection</SelectItem>
            <SelectItem value="subtract">Subtract from Selection</SelectItem>
            <SelectItem value="intersect">Intersect with Selection</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Separator />

      {/* Marquee Tool Options (Rect/Ellipse) */}
      {(isMarqueeTool || isLassoTool) && (
        <div className="grid gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fixed-ratio"
              checked={settings.fixedRatio}
              onCheckedChange={(checked) => handleCheckboxChange('fixedRatio', Boolean(checked))}
            />
            <Label htmlFor="fixed-ratio" className="text-sm font-medium leading-none">
              Fixed Ratio/Size
            </Label>
          </div>
          
          {settings.fixedRatio && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="grid gap-1">
                <Label htmlFor="fixed-width">Width</Label>
                <Input 
                  id="fixed-width" 
                  type="number" 
                  value={settings.fixedWidth} 
                  onChange={(e) => handleInputNumberChange('fixedWidth', e)}
                  onBlur={(e) => handleInputNumberCommit('fixedWidth', e)}
                  className="h-8"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="fixed-height">Height</Label>
                <Input 
                  id="fixed-height" 
                  type="number" 
                  value={settings.fixedHeight} 
                  onChange={(e) => handleInputNumberChange('fixedHeight', e)}
                  onBlur={(e) => handleInputNumberCommit('fixedHeight', e)}
                  className="h-8"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Magic Wand / Quick Select Options */}
      {isMagicWandTool && (
        <>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tolerance">Tolerance</Label>
              <span className="w-10 text-right text-sm text-muted-foreground">{settings.tolerance}</span>
            </div>
            <Slider
              id="tolerance"
              min={0}
              max={255}
              step={1}
              value={[settings.tolerance]}
              onValueChange={([v]) => handleSliderChange('tolerance', v)}
              onValueCommit={([v]) => handleSliderCommit('tolerance', v)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="contiguous"
              checked={settings.contiguous}
              onCheckedChange={(checked) => handleCheckboxChange('contiguous', Boolean(checked))}
            />
            <Label htmlFor="contiguous" className="text-sm font-medium leading-none">
              Contiguous
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sample-all-layers"
              checked={settings.sampleAllLayers}
              onCheckedChange={(checked) => handleCheckboxChange('sampleAllLayers', Boolean(checked))}
            />
            <Label htmlFor="sample-all-layers" className="text-sm font-medium leading-none">
              Sample All Layers
            </Label>
          </div>
        </>
      )}
      
      {/* Lasso Magnetic Options */}
      {activeTool === 'lassoMagnetic' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="edge-detection">Edge Detection</Label>
            <span className="w-10 text-right text-sm text-muted-foreground">{settings.edgeDetection}</span>
          </div>
          <Slider
            id="edge-detection"
            min={0}
            max={100}
            step={1}
            value={[settings.edgeDetection]}
            onValueChange={([v]) => handleSliderChange('edgeDetection', v)}
            onValueCommit={([v]) => handleSliderCommit('edgeDetection', v)}
          />
        </div>
      )}
      
      {/* General Selection Options */}
      <Separator />
      
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="feather">Feather</Label>
          <span className="w-10 text-right text-sm text-muted-foreground">{settings.feather}px</span>
        </div>
        <Slider
          id="feather"
          min={0}
          max={50}
          step={1}
          value={[settings.feather]}
          onValueChange={([v]) => handleSliderChange('feather', v)}
          onValueCommit={([v]) => handleSliderCommit('feather', v)}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="anti-alias"
          checked={settings.antiAlias}
          onCheckedChange={(checked) => handleCheckboxChange('antiAlias', Boolean(checked))}
        />
        <Label htmlFor="anti-alias" className="text-sm font-medium leading-none">
          Anti-alias
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-transform"
          checked={settings.showTransformControls}
          onCheckedChange={(checked) => handleCheckboxChange('showTransformControls', Boolean(checked))}
        />
        <Label htmlFor="show-transform" className="text-sm font-medium leading-none">
          Show Transform Controls (Stub)
        </Label>
      </div>
    </div>
  );
};