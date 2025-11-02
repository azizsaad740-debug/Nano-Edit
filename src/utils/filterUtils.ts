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
    // Stub check for curves: check if it's the default straight line
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
 * (Stub implementation)
 */
export const calculateLookupTable = (points: Point[]): number[] => {
  // In a real implementation, this would interpolate the curve points.
  // For the stub, we return a straight line LUT if default, or a simple curve if not.
  if (isDefault(points)) {
    return Array.from({ length: 256 }, (_, i) => i);
  }
  // Simple stub: invert the curve if points are defined
  return Array.from({ length: 256 }, (_, i) => Math.min(255, Math.max(0, 255 - i)));
};