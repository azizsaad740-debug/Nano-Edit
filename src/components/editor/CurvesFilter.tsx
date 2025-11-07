import React from 'react';
import { isDefault, calculateLookupTable } from '@/utils/filterUtils';
import type { CurvesState } from '@/types/editor';

interface CurvesFilterProps {
  curves: CurvesState;
}

export const CurvesFilter: React.FC<CurvesFilterProps> = ({ curves }) => {
  const isCurvesActive = !(isDefault(curves.all) && isDefault(curves.r) && isDefault(curves.g) && isDefault(curves.b));

  if (!isCurvesActive) {
    return null;
  }

  // Calculate LUTs (normalized 0-1 arrays)
  const lutAll = calculateLookupTable(curves.all).join(' ');
  const lutR = calculateLookupTable(curves.r).join(' ');
  const lutG = calculateLookupTable(curves.g).join(' ');
  const lutB = calculateLookupTable(curves.b).join(' ');

  // Determine which LUT to use for each channel: channel-specific overrides 'all'
  // If the channel-specific curve is default, use the 'all' curve.
  const finalLutR = isDefault(curves.r) ? lutAll : lutR;
  const finalLutG = isDefault(curves.g) ? lutAll : lutG;
  const finalLutB = isDefault(curves.b) ? lutAll : lutB;

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="curves-filter">
        <feComponentTransfer>
          {/* Red Channel: Apply R curve, or All curve if R is default */}
          <feFuncR type="table" tableValues={finalLutR} />
          
          {/* Green Channel: Apply G curve, or All curve if G is default */}
          <feFuncG type="table" tableValues={finalLutG} />
          
          {/* Blue Channel: Apply B curve, or All curve if B is default */}
          <feFuncB type="table" tableValues={finalLutB} />
          
          {/* Alpha Channel (unchanged) */}
          <feFuncA type="identity" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
};