import type { EditState, HslAdjustment, Point } from '@/types/editor';

type FilterState = Pick<EditState, 'adjustments' | 'effects' | 'grading' | 'selectedFilter' | 'hslAdjustments'>;

export const getFilterString = (state: FilterState): string => {
  const { 
    selectedFilter, 
    // Provide safe defaults for nested objects
    adjustments = { brightness: 100, contrast: 100, saturation: 100 },
    grading = { grayscale: 0, sepia: 0, invert: 0 },
    hslAdjustments = { 
      master: { hue: 0, saturation: 100, lightness: 0 },
      red: { hue: 0, saturation: 100, lightness: 0 },
      orange: { hue: 0, saturation: 100, lightness: 0 },
      yellow: { hue: 0, saturation: 100, lightness: 0 },
      green: { hue: 0, saturation: 100, lightness: 0 },
      aqua: { hue: 0, saturation: 100, lightness: 0 },
      blue: { hue: 0, saturation: 100, lightness: 0 },
      purple: { hue: 0, saturation: 100, lightness: 0 },
      magenta: { hue: 0, saturation: 100, lightness: 0 },
    }
  } = state;
  
  // NOTE: HSL adjustments (hue-rotate, global saturation/lightness) are now handled 
  // exclusively by the HslFilter SVG component to allow for per-color adjustments.
  
  const filters = [
    selectedFilter,
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
    `grayscale(${grading.grayscale}%)`,
    `sepia(${grading.sepia}%)`,
    `invert(${grading.invert}%)`,
  ];

  return filters.filter(Boolean).join(' ');
};

// --- Utility functions for Curves and HSL Filters ---

/**
 * Checks if a set of points (or a single HSL adjustment) is at its default state.
 */
export const isDefault = (value: Point[] | number): boolean => {
  if (Array.isArray(value)) {
    // Check for curves: check if it's the default straight line
    return value.length === 2 && value[0].x === 0 && value[0].y === 0 && value[1].x === 255 && value[1].y === 255;
  }
  return value === 0;
};

/**
 * Checks if an HSL adjustment object is at its default state (0, 0, 0).
 */
export const isDefaultHsl = (adj: HslAdjustment): boolean => {
  // Note: Saturation default is 0 (no change), but the initial state is 100 (no change relative to 100%).
  // Since the HSL UI uses -100 to 100, where 0 is no change, we check against 0.
  return adj.hue === 0 && adj.saturation === 0 && adj.lightness === 0;
};

/**
 * Calculates a 256-entry lookup table (LUT) from a set of curve points.
 * The output values are normalized to the range [0, 1] for SVG feComponentTransfer.
 */
export const calculateLookupTable = (points: Point[]): number[] => {
  const lut: number[] = [];
  
  // Sort points by X coordinate
  const sortedPoints = points.slice().sort((a, b) => a.x - b.x);

  for (let i = 0; i < 256; i++) {
    let outputY = 0;
    
    // Find the segment (p1, p2) that contains the current input value i
    for (let j = 0; j < sortedPoints.length - 1; j++) {
      const p1 = sortedPoints[j];
      const p2 = sortedPoints[j + 1];
      
      if (i >= p1.x && i <= p2.x) {
        // Linear interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
        const x1 = p1.x;
        const y1 = p1.y;
        const x2 = p2.x;
        const y2 = p2.y;
        
        if (x2 === x1) {
          outputY = y1; 
        } else {
          outputY = y1 + (i - x1) * (y2 - y1) / (x2 - x1);
        }
        break;
      }
    }
    
    // Clamp output Y to [0, 255] and normalize to [0, 1]
    const normalizedY = Math.min(255, Math.max(0, outputY)) / 255;
    lut.push(normalizedY);
  }
  
  return lut;
};