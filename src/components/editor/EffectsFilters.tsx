"use client";

import * as React from "react";
import type { EditState } from "@/types/editor";

interface EffectsFiltersProps {
  effects: EditState['effects'];
}

export const EffectsFilters = ({ effects }: EffectsFiltersProps) => {
  const { blur, hueShift, sharpen, clarity } = effects;

  if (blur === 0 && hueShift === 0 && sharpen === 0 && clarity === 0) {
    return null;
  }

  const sharpenAmount = sharpen / 100 * 1.5;
  const sharpenRadius = 0.75;

  const clarityAmount = clarity / 100 * 2;
  const clarityRadius = 3;

  let lastResult = "SourceGraphic";

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="advanced-effects-filter">
        {blur > 0 && (
          <feGaussianBlur in={lastResult} stdDeviation={blur} result="blurred" />
        )}
        {blur > 0 && (lastResult = "blurred")}

        {hueShift !== 0 && (
          <feColorMatrix in={lastResult} type="hueRotate" values={String(hueShift)} result="hueShifted" />
        )}
        {hueShift !== 0 && (lastResult = "hueShifted")}

        {sharpen > 0 && (
          <>
            <feGaussianBlur in={lastResult} stdDeviation={sharpenRadius} result="sharpenBlur" />
            <feComposite in={lastResult} in2="sharpenBlur" operator="arithmetic" k1="0" k2={1 + sharpenAmount} k3={-sharpenAmount} k4="0" result="sharpened" />
          </>
        )}
        {sharpen > 0 && (lastResult = "sharpened")}

        {clarity > 0 && (
          <>
            <feGaussianBlur in={lastResult} stdDeviation={clarityRadius} result="clarityBlur" />
            <feComposite in={lastResult} in2="clarityBlur" operator="arithmetic" k1="0" k2={1 + clarityAmount} k3={-clarityAmount} k4="0" result="clarified" />
          </>
        )}
        {clarity > 0 && (lastResult = "clarified")}
      </filter>
    </svg>
  );
};