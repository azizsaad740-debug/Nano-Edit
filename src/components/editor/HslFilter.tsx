"use client";

import * as React from "react";
import type { EditState, HslAdjustment, HslColorKey } from "@/hooks/useEditorState";

interface HslFilterProps {
  hslAdjustments: EditState['hslAdjustments'];
}

const HSL_COLOR_KEYS: HslColorKey[] = ['global', 'red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'];

const isDefaultHsl = (hsl: HslAdjustment) => hsl.hue === 0 && hsl.saturation === 100 && hsl.luminance === 0;

export const HslFilter = ({ hslAdjustments }: HslFilterProps) => {
  const isActive = Object.values(hslAdjustments).some(hsl => !isDefaultHsl(hsl));

  if (!isActive) {
    return null;
  }

  let currentInput = "SourceGraphic";
  let filterNodes: React.ReactNode[] = [];
  let resultCounter = 0;

  // Iterate over all color keys, starting with 'global'
  for (const colorKey of HSL_COLOR_KEYS) {
    const hsl = hslAdjustments[colorKey];
    if (isDefaultHsl(hsl)) continue;

    const hueRotate = hsl.hue;
    const saturationAmount = hsl.saturation / 100;
    const luminanceOffset = hsl.luminance / 100;

    // --- Structural Placeholder for Color Isolation (Only for per-color keys) ---
    if (colorKey !== 'global') {
        // In a real implementation, this section would contain complex feColorMatrix
        // operations to isolate the hue range of 'colorKey' and create a mask,
        // which would then be used with feComposite to apply the adjustment only to that range.
        // For now, we apply the adjustment globally, which stacks but demonstrates the filter chaining structure.
    }

    // Apply Hue Rotation
    if (hueRotate !== 0) {
      resultCounter++;
      filterNodes.push(
        <feColorMatrix 
          key={`${colorKey}-hue-${resultCounter}`}
          type="hueRotate" 
          values={String(hueRotate)} 
          in={currentInput}
          result={`result${resultCounter}`} 
        />
      );
      currentInput = `result${resultCounter}`;
    }
    
    // Apply Saturation
    if (saturationAmount !== 1) {
      resultCounter++;
      filterNodes.push(
        <feColorMatrix 
          key={`${colorKey}-sat-${resultCounter}`}
          type="saturate" 
          values={String(saturationAmount)} 
          in={currentInput}
          result={`result${resultCounter}`}
        />
      );
      currentInput = `result${resultCounter}`;
    }
    
    // Apply Luminance (Brightness Offset)
    if (luminanceOffset !== 0) {
      resultCounter++;
      filterNodes.push(
        <feComponentTransfer 
          key={`${colorKey}-lum-${resultCounter}`}
          in={currentInput}
          result={`result${resultCounter}`}
        >
          <feFuncR type="linear" slope={1} intercept={luminanceOffset} />
          <feFuncG type="linear" slope={1} intercept={luminanceOffset} />
          <feFuncB type="linear" slope={1} intercept={luminanceOffset} />
        </feComponentTransfer>
      );
      currentInput = `result${resultCounter}`;
    }
  }

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="hsl-filter">
        {filterNodes}
        <feMerge>
          <feMergeNode in={currentInput} />
        </feMerge>
      </filter>
    </svg>
  );
};