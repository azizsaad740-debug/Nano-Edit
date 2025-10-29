"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings, Move, SquareDashedMousePointer, MousePointer2, MousePointer, Wand2, ScanEye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ActiveTool, SelectionSettings } from "@/types/editor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SelectionToolOptionsProps {
  activeTool: ActiveTool | null;
  settings: SelectionSettings;
  onSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSettingCommit: (key: keyof SelectionSettings, value: any) => void;
}

const SelectionToolOptions: React.FC<SelectionToolOptionsProps> = ({
  activeTool,
  settings,
  onSettingChange,
  onSettingCommit,
}) => {
  const isMarquee = activeTool?.startsWith('marquee');
  const isLasso = activeTool?.startsWith('lasso');
  const isQuickSelect = activeTool === 'quickSelect';
  const isMagicWand = activeTool === 'magicWand';
  const isObjectSelect = activeTool === 'objectSelect';
  const isMoveTool = activeTool === 'move';
  
  const isSelectionToolActive = isMarquee || isLasso || isQuickSelect || isMagicWand || isObjectSelect;

  const handleSliderChange = (key: keyof SelectionSettings, value: number) => {
    onSettingChange(key, value);
  };

  const handleSliderCommit = (key: keyof SelectionSettings, value: number) => {
    onSettingCommit(key, value);
  };

  const handleCheckboxChange = (key: keyof SelectionSettings, checked: boolean) => {
    onSettingChange(key, checked);
    onSettingCommit(key, checked);
  };

  const handleInputChange = (key: keyof SelectionSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onSettingChange(key, value);
  };

  const handleInputCommit = (key: keyof SelectionSettings, e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onSettingCommit(key, value);
  };

  const renderToolIcon = () => {
    if (isMoveTool) return <Move className="h-5 w-5 mr-2" />;
    if (isMarquee) return <SquareDashedMousePointer className="h-5 w-5 mr-2" />;
    if (isLasso) return <MousePointer2 className="h-5 w-5 mr-2" />;
    if (isQuickSelect) return <MousePointer className="h-5 w-5 mr-2" />;
    if (isMagicWand) return <Wand2 className="h-5 w-5 mr-2" />;
    if (isObjectSelect) return <ScanEye className="h-5 w-5 mr-2" />;
    return <Settings className="h-5 w-5 mr-2" />;
  };

  const renderMoveToolOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoSelectLayer"
          checked={settings.autoSelectLayer}
          onCheckedChange={(c) => handleCheckboxChange('autoSelectLayer', Boolean(c))}
        />
        <Label htmlFor="autoSelectLayer" className="text-sm font-medium leading-none">
          Auto-select Layer
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="showTransformControls"
          checked={settings.showTransformControls}
          onCheckedChange={(c) => handleCheckboxChange('showTransformControls', Boolean(c))}
        />
        <Label htmlFor="showTransformControls" className="text-sm font-medium leading-none">
          Show Transform Controls
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="snapToPixels"
          checked={settings.snapToPixels}
          onCheckedChange={(c) => handleCheckboxChange('snapToPixels', Boolean(c))}
        />
        <Label htmlFor="snapToPixels" className="text-sm font-medium leading-none">
          Snap to Pixels
        </Label>
      </div>
    </div>
  );

  const renderMarqueeOptions = () => (
    <div className="space-y-4">
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
          id="antiAlias"
          checked={settings.antiAlias}
          onCheckedChange={(c) => handleCheckboxChange('antiAlias', Boolean(c))}
        />
        <Label htmlFor="antiAlias" className="text-sm font-medium leading-none">
          Anti-alias
        </Label>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Style</h4>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fixedRatio"
            checked={settings.fixedRatio}
            onCheckedChange={(c) => handleCheckboxChange('fixedRatio', Boolean(c))}
          />
          <Label htmlFor="fixedRatio" className="text-sm font-medium leading-none">
            Fixed Ratio / Size
          </Label>
        </div>
        {settings.fixedRatio && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Input
              type="number"
              placeholder="Width (px)"
              value={settings.fixedWidth}
              onChange={(e) => handleInputChange('fixedWidth', e)}
              onBlur={(e) => handleInputCommit('fixedWidth', e)}
              min={0}
            />
            <Input
              type="number"
              placeholder="Height (px)"
              value={settings.fixedHeight}
              onChange={(e) => handleInputChange('fixedHeight', e)}
              onBlur={(e) => handleInputCommit('fixedHeight', e)}
              min={0}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderLassoOptions = () => (
    <div className="space-y-4">
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
          id="antiAlias"
          checked={settings.antiAlias}
          onCheckedChange={(c) => handleCheckboxChange('antiAlias', Boolean(c))}
        />
        <Label htmlFor="antiAlias" className="text-sm font-medium leading-none">
          Anti-alias
        </Label>
      </div>
      {activeTool === 'lassoMagnetic' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="edgeDetection">Edge Detection</Label>
            <span className="w-10 text-right text-sm text-muted-foreground">{settings.edgeDetection}%</span>
          </div>
          <Slider
            id="edgeDetection"
            min={0}
            max={100}
            step={1}
            value={[settings.edgeDetection]}
            onValueChange={([v]) => handleSliderChange('edgeDetection', v)}
            onValueCommit={([v]) => handleSliderCommit('edgeDetection', v)}
          />
        </div>
      )}
    </div>
  );

  const renderQuickMagicOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="sampleAllLayers"
          checked={settings.sampleAllLayers}
          onCheckedChange={(c) => handleCheckboxChange('sampleAllLayers', Boolean(c))}
        />
        <Label htmlFor="sampleAllLayers" className="text-sm font-medium leading-none">
          Sample All Layers
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="antiAlias"
          checked={settings.antiAlias}
          onCheckedChange={(c) => handleCheckboxChange('antiAlias', Boolean(c))}
        />
        <Label htmlFor="antiAlias" className="text-sm font-medium leading-none">
          Anti-alias
        </Label>
      </div>
      
      {isMagicWand && (
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
              onCheckedChange={(c) => handleCheckboxChange('contiguous', Boolean(c))}
            />
            <Label htmlFor="contiguous" className="text-sm font-medium leading-none">
              Contiguous
            </Label>
          </div>
        </>
      )}
      
      {isQuickSelect && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="autoEnhanceEdges"
            checked={settings.autoEnhanceEdges}
            onCheckedChange={(c) => handleCheckboxChange('autoEnhanceEdges', Boolean(c))}
          />
          <Label htmlFor="autoEnhanceEdges" className="text-sm font-medium leading-none">
            Auto-enhance Edges
          </Label>
        </div>
      )}
    </div>
  );

  const renderObjectSelectionOptions = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        AI-powered object detection is active.
      </p>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoEnhanceEdges"
          checked={settings.autoEnhanceEdges}
          onCheckedChange={(c) => handleCheckboxChange('autoEnhanceEdges', Boolean(c))}
        />
        <Label htmlFor="autoEnhanceEdges" className="text-sm font-medium leading-none">
          Auto-refine Edges
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="sampleAllLayers"
          checked={settings.sampleAllLayers}
          onCheckedChange={(c) => handleCheckboxChange('sampleAllLayers', Boolean(c))}
        />
        <Label htmlFor="sampleAllLayers" className="text-sm font-medium leading-none">
          Sample All Layers
        </Label>
      </div>
    </div>
  );

  const renderRefineEdgeOptions = () => (
    <Accordion type="single" collapsible className="w-full" defaultValue="refine-edge">
      <AccordionItem value="refine-edge">
        <AccordionTrigger className="font-semibold">Selection Refinement (Stub)</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="refineFeather">Feather</Label>
              <span className="w-10 text-right text-sm text-muted-foreground">{settings.refineFeather}px</span>
            </div>
            <Slider
              id="refineFeather"
              min={0}
              max={50}
              step={1}
              value={[settings.refineFeather]}
              onValueChange={([v]) => handleSliderChange('refineFeather', v)}
              onValueCommit={([v]) => handleSliderCommit('refineFeather', v)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="refineSmooth">Smooth</Label>
              <span className="w-10 text-right text-sm text-muted-foreground">{settings.refineSmooth}</span>
            </div>
            <Slider
              id="refineSmooth"
              min={0}
              max={100}
              step={1}
              value={[settings.refineSmooth]}
              onValueChange={([v]) => handleSliderChange('refineSmooth', v)}
              onValueCommit={([v]) => handleSliderCommit('refineSmooth', v)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="refineContrast">Contrast</Label>
              <span className="w-10 text-right text-sm text-muted-foreground">{settings.refineContrast}%</span>
            </div>
            <Slider
              id="refineContrast"
              min={0}
              max={100}
              step={1}
              value={[settings.refineContrast]}
              onValueChange={([v]) => handleSliderChange('refineContrast', v)}
              onValueCommit={([v]) => handleSliderCommit('refineContrast', v)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="refineShiftEdge">Shift Edge</Label>
              <span className="w-10 text-right text-sm text-muted-foreground">{settings.refineShiftEdge}%</span>
            </div>
            <Slider
              id="refineShiftEdge"
              min={-100}
              max={100}
              step={1}
              value={[settings.refineShiftEdge]}
              onValueChange={([v]) => handleSliderChange('refineShiftEdge', v)}
              onValueCommit={([v]) => handleSliderCommit('refineShiftEdge', v)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="decontaminateColors"
              checked={settings.decontaminateColors}
              onCheckedChange={(c) => handleCheckboxChange('decontaminateColors', Boolean(c))}
            />
            <Label htmlFor="decontaminateColors" className="text-sm font-medium leading-none">
              Decontaminate Colors
            </Label>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const renderOptions = () => {
    if (isMoveTool) return renderMoveToolOptions();
    if (isMarquee) return renderMarqueeOptions();
    if (isLasso) return renderLassoOptions();
    if (isQuickSelect || isMagicWand) return renderQuickMagicOptions();
    if (isObjectSelect) return renderObjectSelectionOptions();
    
    return (
      <p className="text-sm text-muted-foreground">
        Select a tool to view its options.
      </p>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold flex items-center">
        {renderToolIcon()}
        {isMoveTool ? 'Move Tool Options' : 'Selection Tool Options'}
      </h3>
      
      {renderOptions()}
      
      {isSelectionToolActive && (
        <>
          <Separator />
          {renderRefineEdgeOptions()}
        </>
      )}
    </div>
  );
};

export default SelectionToolOptions;