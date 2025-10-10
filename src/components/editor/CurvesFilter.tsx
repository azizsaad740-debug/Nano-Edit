"use client";

import * as React from "react";
import type { Point, EditState } from "@/hooks/useEditorState";

interface CurvesFilterProps {
  curves: EditState['curves'];
}

// Linear interpolation
const lerp = (x0: number, y0: number, x1: number, y1: number, x: number) => {
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
};

const calculateLookupTable = (points: Point[]): number[] => {
  if (!points || points.length < 2) {
    return Array.from({ length: 256 }, (_, i) => i);
  }

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  const table = new Array(256);

  for (let i = 0; i < 256; i++) {
    let y = i;
    for (let j = 0; j < sortedPoints.length - 1; j++) {
      const p1 = sortedPoints[j];
      const p2 = sortedPoints[j + 1];
      if (i >= p1.x && i <= p2.x) {
        y = lerp(p1.x, p1.y, p2.x, p2.y, i);
        break;
      }
    }
    table[i] = Math.max(0, Math.min(255, Math.round(y)));
  }

  return table;
};

const composeTables = (table1: number[], table2: number[]): number[] => {
  const result = new Array(256);
  for (let i = 0; i < 256; i++) {
    result[i] = table2[table1[i]];
  }
  return result;
};

const tableToValuesString = (table: number[]): string => {
  return table.map(v => v / 255).join(' ');
};

export const CurvesFilter = ({ curves }: CurvesFilterProps) => {
  const isDefault = (points: Point[]) => JSON.stringify(points) === JSON.stringify([{ x: 0, y: 0 }, { x: 255, y: 255 }]);

  if (isDefault(curves.all) && isDefault(curves.r) && isDefault(curves.g) && isDefault(curves.b)) {
    return null;
  }

  const lutAll = calculateLookupTable(curves.all);
  const lutR = calculateLookupTable(curves.r);
  const lutG = calculateLookupTable(curves.g);
  const lutB = calculateLookupTable(curves.b);

  const finalLutR = composeTables(lutAll, lutR);
  const finalLutG = composeTables(lutAll, lutG);
  const finalLutB = composeTables(lutAll, lutB);

  const tableValuesR = tableToValuesString(finalLutR);
  const tableValuesG = tableToValuesString(finalLutG);
  const tableValuesB = tableToValuesString(finalLutB);

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="curves-filter">
        <feComponentTransfer>
          <feFuncR type="table" tableValues={tableValuesR} />
          <feFuncG type="table" tableValues={tableValuesG} />
          <feFuncB type="table" tableValues={tableValuesB} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
};