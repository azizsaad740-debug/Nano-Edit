"use client";

import * as React from "react";
import type { Point } from "@/hooks/useEditorState";

interface CurvesFilterProps {
  points: Point[];
}

// Linear interpolation
const lerp = (x0: number, y0: number, x1: number, y1: number, x: number) => {
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
};

const calculateTableValues = (points: Point[]): string => {
  if (!points || points.length < 2) {
    return Array.from({ length: 256 }, (_, i) => i / 255).join(' ');
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
    table[i] = Math.max(0, Math.min(255, y)) / 255;
  }

  return table.join(' ');
};

export const CurvesFilter = ({ points }: CurvesFilterProps) => {
  const isDefault = JSON.stringify(points) === JSON.stringify([{ x: 0, y: 0 }, { x: 255, y: 255 }]);
  if (isDefault) {
    return null;
  }

  const tableValues = calculateTableValues(points);

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="curves-filter">
        <feComponentTransfer>
          <feFuncR type="table" tableValues={tableValues} />
          <feFuncG type="table" tableValues={tableValues} />
          <feFuncB type="table" tableValues={tableValues} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
};