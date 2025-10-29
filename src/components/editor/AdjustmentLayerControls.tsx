"use client";

import * as React from "react";
import type { Layer, AdjustmentLayerData, HslAdjustment, EditState, Point, HslColorKey, AdjustmentState, GradingState, HslAdjustmentsState, CurvesState } from "@/types/editor";
import { initialCurvesState, initialHslAdjustment } from "@/types/editor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LightingAdjustments from "./LightingAdjustments";
import ColorGrading from "./ColorGrading";
import HslAdjustments from "./HslAdjustments";
import Curves from "./Curves";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";


type AdjustmentType = AdjustmentLayerData['adjustmentData']['type'];

interface AdjustmentLayerControlsProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  imgRef: React.RefObject<HTMLImageElement>;
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
}

const AdjustmentLayerControls = ({ layer, onUpdate, onCommit, imgRef, customHslColor, setCustomHslColor }: AdjustmentLayerControlsProps) => {
  if (!layer || layer.type !== 'adjustment' || !layer.adjustmentData) {
    return <p className="text-sm text-muted-foreground">Select an adjustment layer to edit its properties.</p>;
  }

  const { adjustmentData } = layer;

  const handleDataUpdate = (updates: Partial<AdjustmentLayerData['adjustmentData']>) => {
    onUpdate(layer.id, { adjustmentData: { ...adjustmentData, ...updates } });
  };

  const handleDataCommit = () => {
    onCommit(layer.id);
  };

  // --- Brightness/Contrast Handlers ---
  const handleAdjustmentChange = (key: keyof AdjustmentState, value: number) => {
    if (adjustmentData.adjustments) {
      handleDataUpdate({ adjustments: { ...adjustmentData.adjustments, [key]: value } });
    }
  };

  const handleAdjustmentCommit = (key: keyof AdjustmentState, value: number) => {
    if (adjustmentData.adjustments) {
      handleDataCommit();
    }
  };

  // --- Color Grading Handlers ---
  const handleGradingChange = (key: keyof GradingState, value: number) => {
    if (adjustmentData.grading) {
      handleDataUpdate({ grading: { ...adjustmentData.grading, [key]: value } });
    }
  };

  const handleGradingCommit = (key: keyof GradingState, value: number) => {
    if (adjustmentData.grading) {
      handleDataCommit();
    }
  };

  // --- HSL Handlers ---
  const handleHslAdjustmentChange = (color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    if (adjustmentData.hslAdjustments) {
      const newHsl: HslAdjustmentsState = { 
        ...adjustmentData.hslAdjustments, 
        [color]: { ...adjustmentData.hslAdjustments[color], [key]: value } 
      };
      handleDataUpdate({ hslAdjustments: newHsl });
    }
  };

  const handleHslAdjustmentCommit = (color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    if (adjustmentData.hslAdjustments) {
      handleDataCommit();
    }
  };

  // --- Curves Handlers ---
  const handleCurvesChange = (channel: keyof CurvesState, points: Point[]) => {
    if (adjustmentData.curves) {
      handleDataUpdate({ curves: { ...adjustmentData.curves, [channel]: points } });
    }
  };

  const handleCurvesCommit = (channel: keyof CurvesState, points: Point[]) => {
    if (adjustmentData.curves) {
      handleDataCommit();
    }
  };

  const handleResetAdjustment = (type: AdjustmentType) => {
    let updates: Partial<AdjustmentLayerData['adjustmentData']> = {};
    let name: string;

    switch (type) {
      case 'brightness':
        updates.adjustments = { brightness: 100, contrast: 100, saturation: 100, exposure: 0, gamma: 100, temperature: 0, tint: 0, highlights: 0, shadows: 0, clarity: 0, vibrance: 100 };
        name = "Reset Brightness/Contrast";
        break;
      case 'curves':
        updates.curves = initialCurvesState;
        name = "Reset Curves";
        break;
      case 'hsl':
        updates.hslAdjustments = { 
          global: { ...initialHslAdjustment }, 
          red: { ...initialHslAdjustment }, 
          orange: { ...initialHslAdjustment }, 
          yellow: { ...initialHslAdjustment }, 
          green: { ...initialHslAdjustment }, 
          aqua: { ...initialHslAdjustment }, 
          blue: { ...initialHslAdjustment }, 
          purple: { ...initialHslAdjustment }, 
          magenta: { ...initialHslAdjustment } 
        };
        name = "Reset HSL";
        break;
      case 'grading':
        updates.grading = { grayscale: 0, sepia: 0, invert: 0, shadowsColor: '#000000', midtonesColor: '#808080', highlightsColor: '#FFFFFF', shadowsLuminance: 0, highlightsLuminance: 0, blending: 50 };
        name = "Reset Color Grading";
        break;
      default:
        return;
    }
    
    onUpdate(layer.id, { adjustmentData: { ...adjustmentData, ...updates } });
    onCommit(layer.id);
  };

  const renderAdjustmentControls = () => {
    switch (adjustmentData.type) {
      case 'brightness':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleResetAdjustment('brightness')}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
            <LightingAdjustments
              adjustments={adjustmentData.adjustments || { brightness: 100, contrast: 100, saturation: 100 }}
              onAdjustmentChange={handleAdjustmentChange as (adjustment: string, value: number) => void}
              onAdjustmentCommit={handleAdjustmentCommit as (adjustment: string, value: number) => void}
            />
          </div>
        );
      case 'curves':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleResetAdjustment('curves')}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
            <Curves
              curves={adjustmentData.curves || initialCurvesState}
              onChange={handleCurvesChange}
              onCommit={handleCurvesCommit}
              imgRef={imgRef}
            />
          </div>
        );
      case 'hsl':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleResetAdjustment('hsl')}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
            <HslAdjustments
              hslAdjustments={adjustmentData.hslAdjustments || {} as EditState['hslAdjustments']}
              onAdjustmentChange={handleHslAdjustmentChange}
              onAdjustmentCommit={handleHslAdjustmentCommit}
              customColor={customHslColor}
              setCustomColor={setCustomHslColor}
            />
          </div>
        );
      case 'grading':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleResetAdjustment('grading')}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
            <ColorGrading
              grading={adjustmentData.grading || { grayscale: 0, sepia: 0, invert: 0 }}
              onGradingChange={handleGradingChange as (gradingType: string, value: number) => void}
              onGradingCommit={handleGradingCommit as (gradingType: string, value: number) => void}
            />
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">Unknown adjustment type.</p>;
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full" defaultValue={['adjustment-controls']}>
        <AccordionItem value="adjustment-controls">
          <AccordionTrigger className="font-semibold capitalize">
            {adjustmentData.type.replace('-', ' ')} Controls
          </AccordionTrigger>
          <AccordionContent>
            {renderAdjustmentControls()}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AdjustmentLayerControls;