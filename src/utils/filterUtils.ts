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
  
  // For now, only use the global HSL adjustment for the filter string
  const globalHsl: HslAdjustment = hslAdjustments.global;

  // Normalize saturation (100% = 1.0)
  const saturationValue = globalHsl.saturation / 100;
  
  // Normalize luminance (0% = 1.0, -100% = 0.0, 100% = 2.0)
  const brightnessAdjustment = 1 + (globalHsl.luminance / 100);

  const filters = [
    selectedFilter,
    `brightness(${adjustments.brightness * brightnessAdjustment / 100}%)`, // Combine brightness and luminance
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation * saturationValue / 100}%)`, // Combine saturation
    `grayscale(${grading.grayscale}%)`,
    `sepia(${grading.sepia}%)`,
    `invert(${grading.invert}%)`,
    `hue-rotate(${globalHsl.hue}deg)`, // Apply hue rotation
  ];

  return filters.filter(Boolean).join(' ');
};