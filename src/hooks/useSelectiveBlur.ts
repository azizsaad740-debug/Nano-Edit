import { useCallback } from 'react';
import type { EditState, Layer, Dimensions } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';

export const useSelectiveBlur = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
  dimensions: Dimensions | null,
) => {
  const selectiveBlurMask = currentEditState.selectiveBlurMask;
  const selectiveBlurAmount = currentEditState.selectiveBlurAmount;

  const handleSelectiveBlurStrokeEnd = useCallback((strokeDataUrl: string, operation: 'add' | 'subtract') => {
    // In a real implementation, this would merge the stroke onto the existing mask.
    // For now, we just set the mask.
    updateCurrentState({ selectiveBlurMask: strokeDataUrl });
    recordHistory("Apply Selective Blur Stroke", currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.selectiveBlurMask !== undefined) {
      updateCurrentState({ selectiveBlurMask: state.selectiveBlurMask });
    }
    if (state.selectiveBlurAmount !== undefined) {
      updateCurrentState({ selectiveBlurAmount: state.selectiveBlurAmount });
    }
  }, [updateCurrentState]);

  return { selectiveBlurMask, handleSelectiveBlurStrokeEnd, applyPreset };
};