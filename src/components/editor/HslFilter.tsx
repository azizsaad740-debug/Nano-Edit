"use client";

import * as React from "react";
import type { EditState, HslAdjustment, HslColorKey } from "@/types/editor";

interface HslFilterProps {
  hslAdjustments: EditState['hslAdjustments'];
}

const isDefaultHsl = (hsl: HslAdjustment) => hsl.hue === 0 && hsl.saturation === 100 && hsl.luminance === 0;

export const HslFilter = ({ hslAdjustments }: HslFilterProps) => {
  const globalHsl = hslAdjustments.global;
  const isActive = !isDefaultHsl(globalHsl);

  if (!isActive) {
    return null;
  }

  let currentInput = "SourceGraphic";
  let filterNodes: React.ReactNode[] = [];
  let resultCounter = 0;

  const hueRotate = globalHsl.hue;
  const saturationAmount = globalHsl.saturation / 100;
  const luminanceOffset = globalHsl.luminance / 100;

  // Apply Hue Rotation
  if (hueRotate !== 0) {
    resultCounter++;
    filterNodes.push(
      <feColorMatrix 
        key={`global-hue-${resultCounter}`}
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
        key={`global-sat-${resultCounter}`}
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
        key={`global-lum-${resultCounter}`}
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