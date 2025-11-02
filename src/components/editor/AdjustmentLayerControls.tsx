import React, { useCallback } from 'react';
import {
  initialHslAdjustment, initialAdjustmentState, initialGradingState,
  type Layer, type AdjustmentLayerData, type HslAdjustment, type EditState, type Point,
  type HslColorKey, type AdjustmentState, type GradingState, type HslAdjustmentsState, type CurvesState,
} from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';

interface AdjustmentLayerControlsProps {
  layer: Layer & AdjustmentLayerData;
  handleUpdate: (updates: Partial<AdjustmentLayerData>) => void;
  handleCommit: (name: string) => void;
  currentEditState: EditState;
}

export const AdjustmentLayerControls: React.FC<AdjustmentLayerControlsProps> = ({ layer, handleUpdate, handleCommit, currentEditState }) => {
  const { adjustmentData } = layer;

  const handleReset = useCallback((type: AdjustmentLayerData['adjustmentData']['type']) => {
    let updates: Partial<AdjustmentLayerData> = {};
    let name: string = `Reset ${type}`;

    switch (type) {
      case 'brightness': // Fix 1, 2
        updates.adjustments = { // Fix 98
          brightness: 100, contrast: 100, saturation: 100, exposure: 0,
          gamma: 100, temperature: 0, tint: 0, highlights: 0, shadows: 0,
          clarity: 0, vibrance: 100, grain: 0, // Fix 47
          whites: 0, blacks: 0, dehaze: 0
        } as AdjustmentState; // Fix 99
        name = "Reset Brightness/Contrast"; // Fix 100
        break;

      case 'hsl': // Fix 3, 4
        updates.hslAdjustments = { // Fix 101
          master: { ...initialHslAdjustment },  // Fix 102
          red: { ...initialHslAdjustment }, // Fix 103
          yellow: { ...initialHslAdjustment }, // Fix 104
          green: { ...initialHslAdjustment }, // Fix 105
          cyan: { ...initialHslAdjustment }, // Fix 106
          blue: { ...initialHslAdjustment }, // Fix 107
          magenta: { ...initialHslAdjustment }, // Fix 108
        } as HslAdjustmentsState;
        name = "Reset HSL"; // Fix 109
        break;

      case 'grading': // Fix 5, 6
        updates.grading = { // Fix 110
          grayscale: 0, sepia: 0, invert: 0,
          shadowsColor: '#000000', midtonesColor: '#808080', highlightsColor: '#FFFFFF',
          shadowsLuminance: 0, highlightsLuminance: 0, blending: 50, balance: 0, // Fix 49
          shadows: { hue: 0, saturation: 0, luminosity: 0 },
          midtones: { hue: 0, saturation: 0, luminosity: 0 },
          highlights: { hue: 0, saturation: 0, luminosity: 0 },
        } as GradingState; // Fix 111
        name = "Reset Color Grading"; // Fix 112
        break;

      default:
        return;
    }

    handleUpdate({ adjustmentData: { ...adjustmentData, ...updates } });
    handleCommit(name);
  }, [adjustmentData, handleUpdate, handleCommit]);

  // ... (rest of component logic)
  return (
    <div>
      {/* ... */}
    </div>
  );
};