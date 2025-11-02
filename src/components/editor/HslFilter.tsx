import React from 'react';
import { isDefaultHsl } from '@/utils/filterUtils'; // Fix 376
import type { HslAdjustmentsState } from '@/types/editor';

interface HslFilterProps { // Fix 375
  hslAdjustments: HslAdjustmentsState;
}

export const HslFilter: React.FC<HslFilterProps> = ({ hslAdjustments }) => {
  const globalHsl = hslAdjustments.master; // Fix 77
  const isActive = !isDefaultHsl(globalHsl); // Fix 376

  if (!isActive) {
    return null;
  }

  return (
    <filter id="hsl-filter">
      {/* ... filter implementation */}
    </filter>
  );
};