import React from 'react';
import { isDefaultHsl } from '@/utils/filterUtils';
import type { HslAdjustmentsState, HslColorKey } from '@/types/editor';

interface HslFilterProps {
  hslAdjustments: HslAdjustmentsState;
}

// Helper function to convert HSL adjustments to a color matrix (simplified for master adjustment)
const getMasterHslMatrix = (adj: HslAdjustmentsState['master']): string => {
  const { hue, saturation, lightness } = adj;
  
  // Hue rotation matrix (simplified: only apply if saturation/lightness are default)
  // Since we cannot easily combine hue rotation with per-channel saturation/lightness in a single matrix,
  // we apply hue rotation separately if needed, but for the master adjustment, we focus on saturation and lightness.
  
  // Saturation (0 = grayscale, 1 = normal, 2 = double saturation)
  const S = 1 + saturation / 100;
  
  // Lightness (Luminosity shift, applied as offset to RGB)
  const L = lightness / 100;
  
  // Simplified Saturation Matrix (based on standard luminosity values)
  const lumR = 0.213;
  const lumG = 0.715;
  const lumB = 0.072;
  
  const matrix = [
    lumR * (1 - S) + S, lumG * (1 - S),     lumB * (1 - S),     0, L,
    lumR * (1 - S),     lumG * (1 - S) + S, lumB * (1 - S),     0, L,
    lumR * (1 - S),     lumG * (1 - S),     lumB * (1 - S) + S, 0, L,
    0,                  0,                  0,                  1, 0,
  ].join(' ');
  
  return matrix;
};

export const HslFilter: React.FC<HslFilterProps> = ({ hslAdjustments }) => {
  const globalHsl = hslAdjustments.master;
  const isActive = !isDefaultHsl(globalHsl);

  if (!isActive) {
    return null;
  }
  
  // Note: Per-color HSL adjustments (red, green, blue, etc.) require complex
  // feComponentTransfer or multiple feColorMatrix operations combined with masks,
  // which is too complex for a simple stub. We only implement the master adjustment here.

  const matrix = getMasterHslMatrix(globalHsl);

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="hsl-filter">
        {/* Apply Saturation and Lightness via Color Matrix */}
        <feColorMatrix 
          type="matrix" 
          values={matrix} 
          result="masterHsl" 
        />
        
        {/* Apply Hue Rotation if needed (requires separate primitive) */}
        {globalHsl.hue !== 0 && (
          <feColorMatrix 
            in="masterHsl" 
            type="hueRotate" 
            values={String(globalHsl.hue)} 
            result="finalHsl" 
          />
        )}
        
        {/* Ensure the final result is named 'finalHsl' or 'masterHsl' */}
        <feMerge>
          <feMergeNode in={globalHsl.hue !== 0 ? "finalHsl" : "masterHsl"} />
        </feMerge>
      </filter>
    </svg>
  );
};