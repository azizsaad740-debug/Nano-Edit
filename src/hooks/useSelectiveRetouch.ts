import { useState, useCallback, useMemo } from 'react';
import type { EditState, Layer, Dimensions } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';

export const useSelectiveRetouch = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
  dimensions: Dimensions | null,
) => {
  // Use correct property names
  const selectiveBlurMask = useMemo(() => currentEditState.selectiveBlurMask, [currentEditState.selectiveBlurMask]);
  const selectiveSharpenMask = useMemo(() => currentEditState.selectiveSharpenMask, [currentEditState.selectiveSharpenMask]);

  const handleSelectiveRetouchStrokeEnd = useCallback((strokeDataUrl: string, layerId: string, tool: 'blur' | 'sharpen') => {
    // ... implementation logic ...
    
    if (tool === 'blur') {
      updateCurrentState({ selectiveBlurMask: strokeDataUrl });
      recordHistory(`Applied Selective Blur Mask`, { ...currentEditState, selectiveBlurMask: strokeDataUrl }, layers);
    } else if (tool === 'sharpen') {
      updateCurrentState({ selectiveSharpenMask: strokeDataUrl });
      recordHistory(`Applied Selective Sharpen Mask`, { ...currentEditState, selectiveSharpenMask: strokeDataUrl }, layers);
    }
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.selectiveBlurMask !== undefined) {
      updateCurrentState({ selectiveBlurMask: state.selectiveBlurMask });
    }
    if (state.selectiveSharpenMask !== undefined) {
      updateCurrentState({ selectiveSharpenMask: state.selectiveSharpenMask });
    }
  }, [updateCurrentState]);

  return { selectiveBlurMask, selectiveSharpenMask, handleSelectiveRetouchStrokeEnd, applyPreset };
};