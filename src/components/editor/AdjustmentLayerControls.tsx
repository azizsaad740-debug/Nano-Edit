import React, { useCallback } from 'react';
import {
  initialHslAdjustment, initialAdjustmentState, initialGradingState, initialCurvesState, initialHslAdjustmentsState,
  type Layer, type AdjustmentLayerData, type HslAdjustment, type EditState, type Point,
  type HslColorKey, type AdjustmentState, type GradingState, type HslAdjustmentsState, type CurvesState,
} from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import LightingAdjustments from "@/components/editor/LightingAdjustments";
import ColorGrading from "@/components/editor/ColorGrading";
import { HslAdjustments } from "@/components/editor/HslAdjustments";
import Curves from "@/components/editor/Curves";

interface AdjustmentLayerControlsProps {
  layer: Layer & AdjustmentLayerData;
  onUpdate: (updates: Partial<Layer>) => void;
  onCommit: (name: string) => void;
  currentEditState: EditState;
  imgRef: React.RefObject<HTMLImageElement>;
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
}

export const AdjustmentLayerControls: React.FC<AdjustmentLayerControlsProps> = ({ layer, onUpdate, onCommit, currentEditState, imgRef, customHslColor, setCustomHslColor }) => {
  const { adjustmentData } = layer;

  const handleReset = useCallback((type: AdjustmentLayerData['adjustmentData']['type']) => {
    let updates: Partial<AdjustmentLayerData['adjustmentData']> = {};
    let name: string = `Reset ${type}`;

    switch (type) {
      case 'brightness':
        updates.adjustments = {
          brightness: 100, contrast: 100, saturation: 100, exposure: 0,
          gamma: 100, temperature: 0, tint: 0, highlights: 0, shadows: 0,
          clarity: 0, vibrance: 100, grain: 0,
          whites: 0, blacks: 0, dehaze: 0
        } as AdjustmentState;
        name = "Reset Brightness/Contrast";
        break;

      case 'hsl':
        updates.hslAdjustments = {
          master: { ...initialHslAdjustment },
          red: { ...initialHslAdjustment },
          orange: { ...initialHslAdjustment },
          yellow: { ...initialHslAdjustment },
          green: { ...initialHslAdjustment },
          aqua: { ...initialHslAdjustment },
          blue: { ...initialHslAdjustment },
          purple: { ...initialHslAdjustment },
          magenta: { ...initialHslAdjustment },
        } as HslAdjustmentsState;
        name = "Reset HSL";
        break;

      case 'grading':
        updates.grading = {
          grayscale: 0, sepia: 0, invert: 0,
          shadowsColor: '#000000', midtonesColor: '#808080', highlightsColor: '#FFFFFF',
          shadowsLuminance: 0, highlightsLuminance: 0, blending: 50, balance: 0,
          shadows: { hue: 0, saturation: 0, luminosity: 0 },
          midtones: { hue: 0, saturation: 0, luminosity: 0 },
          highlights: { hue: 0, saturation: 0, luminosity: 0 },
        } as GradingState;
        name = "Reset Color Grading";
        break;
        
      case 'curves':
        updates.curves = initialCurvesState;
        name = "Reset Curves";
        break;

      default:
        return;
    }

    onUpdate({ adjustmentData: { ...adjustmentData, ...updates } });
    onCommit(name);
  }, [adjustmentData, onUpdate, onCommit]);
  
  // --- Handlers for Brightness/Contrast/Saturation (Adjustments) ---
  const handleAdjustmentChange = useCallback((key: string, value: number) => {
    const currentAdjustments = adjustmentData.adjustments || initialAdjustmentState;
    const newAdjustments = { ...currentAdjustments, [key]: value };
    onUpdate({ adjustmentData: { ...adjustmentData, adjustments: newAdjustments } });
  }, [adjustmentData, onUpdate]);

  const handleAdjustmentCommit = useCallback((key: string, value: number) => {
    const currentAdjustments = adjustmentData.adjustments || initialAdjustmentState;
    const newAdjustments = { ...currentAdjustments, [key]: value };
    onUpdate({ adjustmentData: { ...adjustmentData, adjustments: newAdjustments } });
    onCommit(`Update Brightness/Contrast: ${key}`);
  }, [adjustmentData, onUpdate, onCommit]);

  // --- Handlers for Grading ---
  const handleGradingChange = useCallback((key: string, value: number) => {
    const currentGrading = adjustmentData.grading || initialGradingState;
    const newGrading = { ...currentGrading, [key]: value };
    onUpdate({ adjustmentData: { ...adjustmentData, grading: newGrading } });
  }, [adjustmentData, onUpdate]);

  const handleGradingCommit = useCallback((key: string, value: number) => {
    const currentGrading = adjustmentData.grading || initialGradingState;
    const newGrading = { ...currentGrading, [key]: value };
    onUpdate({ adjustmentData: { ...adjustmentData, grading: newGrading } });
    onCommit(`Update Color Grading: ${key}`);
  }, [adjustmentData, onUpdate, onCommit]);

  // --- Handlers for HSL ---
  const handleHslAdjustmentChange = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    const currentHsl = adjustmentData.hslAdjustments || initialHslAdjustmentsState;
    const newHsl = {
      ...currentHsl,
      [color]: {
        ...currentHsl[color],
        [key]: value,
      },
    };
    onUpdate({ adjustmentData: { ...adjustmentData, hslAdjustments: newHsl } });
  }, [adjustmentData, onUpdate]);

  const handleHslAdjustmentCommit = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    const currentHsl = adjustmentData.hslAdjustments || initialHslAdjustmentsState;
    const newHsl = {
      ...currentHsl,
      [color]: {
        ...currentHsl[color],
        [key]: value,
      },
    };
    onUpdate({ adjustmentData: { ...adjustmentData, hslAdjustments: newHsl } });
    onCommit(`Update HSL: ${color}/${key}`);
  }, [adjustmentData, onUpdate, onCommit]);

  // --- Handlers for Curves ---
  const handleCurvesChange = useCallback((channel: keyof CurvesState, points: Point[]) => {
    const currentCurves = adjustmentData.curves || initialCurvesState;
    const newCurves = { ...currentCurves, [channel]: points };
    onUpdate({ adjustmentData: { ...adjustmentData, curves: newCurves } });
  }, [adjustmentData, onUpdate]);

  const handleCurvesCommit = useCallback((channel: keyof CurvesState, points: Point[]) => {
    const currentCurves = adjustmentData.curves || initialCurvesState;
    const newCurves = { ...currentCurves, [channel]: points };
    onUpdate({ adjustmentData: { ...adjustmentData, curves: newCurves } });
    onCommit(`Update Curves: ${channel}`);
  }, [adjustmentData, onUpdate, onCommit]);


  if (adjustmentData.type === 'brightness') {
    const adjustments = adjustmentData.adjustments || initialAdjustmentState;
    return (
      <LightingAdjustments
        adjustments={{
          brightness: adjustments.brightness,
          contrast: adjustments.contrast,
          saturation: adjustments.saturation,
        }}
        onAdjustmentChange={handleAdjustmentChange}
        onAdjustmentCommit={handleAdjustmentCommit}
      />
    );
  } else if (adjustmentData.type === 'grading') {
    const grading = adjustmentData.grading || initialGradingState;
    return (
      <ColorGrading
        grading={{
          grayscale: grading.grayscale,
          sepia: grading.sepia,
          invert: grading.invert,
        }}
        onGradingChange={handleGradingChange}
        onGradingCommit={handleGradingCommit}
      />
    );
  } else if (adjustmentData.type === 'hsl') {
    const hslAdjustments = adjustmentData.hslAdjustments || initialHslAdjustmentsState;
    return (
      <HslAdjustments
        hslAdjustments={hslAdjustments}
        onAdjustmentChange={handleHslAdjustmentChange}
        onAdjustmentCommit={handleHslAdjustmentCommit}
        customColor={customHslColor}
        setCustomColor={setCustomHslColor}
      />
    );
  } else if (adjustmentData.type === 'curves') {
    const curves = adjustmentData.curves || initialCurvesState;
    return (
      <Curves
        curves={curves}
        onCurvesChange={handleCurvesChange}
        onCurvesCommit={handleCurvesCommit}
        imgRef={imgRef}
      />
    );
  }

  // Default placeholder
  return (
    <div>
      <p className="text-sm text-muted-foreground">Controls for {adjustmentData.type} adjustment layer (Stub)</p>
      <button onClick={() => handleReset(adjustmentData.type)} className="text-primary text-xs mt-2">
        Reset {adjustmentData.type}
      </button>
    </div>
  );
};