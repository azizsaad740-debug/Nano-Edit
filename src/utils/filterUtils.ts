import type { EditState, HslAdjustment } from '@/hooks/useEditorState';

type FilterState = Pick<EditState, 'adjustments' | 'effects' | 'grading' | 'selectedFilter' | 'hslAdjustments'>;

export const getFilterString = (state: FilterState): string => {
  const { 
    selectedFilter, 
    // Provide safe defaults for nested objects
    adjustments = { brightness: 100, contrast: 100, saturation: 100 },
    grading = { grayscale: 0, sepia: 0, invert: 0 },
    hslAdjustments = { 
      global: { hue: 0, saturation: 100, luminance: 0 },
      red: { hue: 0, saturation: 100, luminance: 0 },
      orange: { hue: 0, saturation: 100, luminance: 0 },
      yellow: { hue: 0, saturation: 100, luminance: 0 },
      green: { hue: 0, saturation: 100, luminance: 0 },
      aqua: { hue: 0, saturation: 100, luminance: 0 },
      blue: { hue: 0, saturation: 100, luminance: 0 },
      purple: { hue: 0, saturation: 100, luminance: 0 },
      magenta: { hue: 0, saturation: 100, luminance: 0 },
    }
  } = state;
  
  // NOTE: HSL adjustments (hue-rotate, global saturation/luminance) are now handled 
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