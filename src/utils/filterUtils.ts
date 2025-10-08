import type { EditState } from '@/hooks/useEditorState';

type FilterState = Pick<EditState, 'adjustments' | 'effects' | 'grading' | 'selectedFilter'>;

export const getFilterString = (state: FilterState): string => {
  const { adjustments, effects, grading, selectedFilter } = state;
  
  const filters = [
    selectedFilter,
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
    `blur(${effects.blur}px)`,
    `hue-rotate(${effects.hueShift}deg)`,
    `grayscale(${grading.grayscale}%)`,
    `sepia(${grading.sepia}%)`,
    `invert(${grading.invert}%)`,
  ];

  return filters.filter(Boolean).join(' ');
};