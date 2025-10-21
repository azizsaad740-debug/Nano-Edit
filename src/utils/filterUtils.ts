import type { EditState } from '@/hooks/useEditorState';

type FilterState = Pick<EditState, 'adjustments' | 'effects' | 'grading' | 'selectedFilter' | 'hslAdjustments'>;

export const getFilterString = (state: FilterState): string => {
  const { adjustments, grading, selectedFilter, hslAdjustments } = state;
  
  // Normalize saturation (100% = 1.0)
  const saturationValue = hslAdjustments.saturation / 100;
  
  // Normalize luminance (0% = 1.0, -100% = 0.0, 100% = 2.0)
  // This is a simplification, as canvas filters don't have a direct luminance control.
  // We approximate luminance change using brightness.
  const brightnessAdjustment = 1 + (hslAdjustments.luminance / 100);

  const filters = [
    selectedFilter,
    `brightness(${adjustments.brightness * brightnessAdjustment / 100}%)`, // Combine brightness and luminance
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation * saturationValue / 100}%)`, // Combine saturation
    `grayscale(${grading.grayscale}%)`,
    `sepia(${grading.sepia}%)`,
    `invert(${grading.invert}%)`,
    `hue-rotate(${hslAdjustments.hue}deg)`, // Apply hue rotation
  ];

  return filters.filter(Boolean).join(' ');
};