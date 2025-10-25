"use client";

import * as React from "react";
import type { EditState, HslAdjustment } from "@/hooks/useEditorState";

interface HslFilterProps {
  hslAdjustments: EditState['hslAdjustments'];
}

const isDefaultHsl = (hsl: HslAdjustment) => hsl.hue === 0 && hsl.saturation === 100 && hsl.luminance === 0;

export const HslFilter = ({ hslAdjustments }: HslFilterProps) => {
  const globalHsl = hslAdjustments.global;
  
  // Check if any HSL adjustment (global or per-color) is active
  const isActive = Object.values(hslAdjustments).some(hsl => !isDefaultHsl(hsl));

  if (!isActive) {
    return null;
  }

  // --- Global HSL Adjustments ---
  
  // 1. Hue Rotation (feColorMatrix type="hueRotate")
  const hueRotate = globalHsl.hue;

  // 2. Saturation (feColorMatrix type="saturate")
  const saturationAmount = globalHsl.saturation / 100;

  // 3. Luminance/Brightness (feComponentTransfer type="linear" slope/intercept)
  // Luminance: -100% (0.0) to 100% (2.0). Default 0% (1.0).
  const luminanceOffset = globalHsl.luminance / 100; // -1 to 1
  const luminanceSlope = 1; // Keep slope at 1 for simple offset
  const luminanceIntercept = luminanceOffset; // Use offset as intercept

  // Determine the input chain
  let lastResult = "SourceGraphic";
  let hueResult = "SourceGraphic";
  let saturateResult = "SourceGraphic";
  let luminanceResult = "SourceGraphic";

  if (hueRotate !== 0) {
    hueResult = "hueShifted";
    lastResult = hueResult;
  }
  if (saturationAmount !== 1) {
    saturateResult = "saturated";
    lastResult = saturateResult;
  }
  if (luminanceOffset !== 0) {
    luminanceResult = "luminanceAdjusted";
    lastResult = luminanceResult;
  }
  
  // If multiple adjustments are active, we need to chain them correctly.
  // The order is typically: Hue -> Saturation -> Luminance.
  
  let currentInput = "SourceGraphic";

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="hsl-filter">
        {/* Step 1: Apply Hue Rotation */}
        {hueRotate !== 0 && (
          <feColorMatrix 
            type="hueRotate" 
            values={String(hueRotate)} 
            in={currentInput}
            result="hueShifted" 
          />
        )}
        {hueRotate !== 0 && (currentInput = "hueShifted")}
        
        {/* Step 2: Apply Saturation */}
        {saturationAmount !== 1 && (
          <feColorMatrix 
            type="saturate" 
            values={String(saturationAmount)} 
            in={currentInput}
            result="saturated"
          />
        )}
        {saturationAmount !== 1 && (currentInput = "saturated")}
        
        {/* Step 3: Apply Luminance (Brightness Offset) */}
        {luminanceOffset !== 0 && (
          <feComponentTransfer 
            in={currentInput}
            result="luminanceAdjusted"
          >
            <feFuncR type="linear" slope={luminanceSlope} intercept={luminanceIntercept} />
            <feFuncG type="linear" slope={luminanceSlope} intercept={luminanceIntercept} />
            <feFuncB type="linear" slope={luminanceSlope} intercept={luminanceIntercept} />
          </feComponentTransfer>
        )}
        {luminanceOffset !== 0 && (currentInput = "luminanceAdjusted")}
        
        {/* Final merge node ensures the output is correct */}
        <feMerge>
          <feMergeNode in={currentInput} />
        </feMerge>
      </filter>
    </svg>
  );
};