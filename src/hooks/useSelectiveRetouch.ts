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

  const handleSelectiveRetouchStrokeEnd = useCallback((strokeDataUrl: string, tool: 'blurBrush' | 'sharpenTool', operation: 'add' | 'subtract') => {
    // NOTE: In a real app, we would merge the strokeDataUrl onto the existing mask
    // using mergeMasks utility, but here we just set the mask for simplicity.
    
    if (tool === 'blurBrush') {
      updateCurrentState({ selectiveBlurMask: strokeDataUrl });
      recordHistory(`Applied Selective Blur Mask`, { ...currentEditState, selectiveBlurMask: strokeDataUrl }, layers);
    } else if (tool === 'sharpenTool') {
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
    if (state.selectiveBlurAmount !== undefined) {
      updateCurrentState({ selectiveBlurAmount: state.selectiveBlurAmount });
    }
    if (state.selectiveSharpenAmount !== undefined) {
      updateCurrentState({ selectiveSharpenAmount: state.selectiveSharpenAmount });
    }
  }, [updateCurrentState]);
  
  const onSelectiveBlurAmountCommit = useCallback((value: number) => {
    recordHistory(`Set Selective Blur Amount to ${value}`, { ...currentEditState, selectiveBlurAmount: value }, layers);
  }, [currentEditState, layers, recordHistory]);
  
  const onSelectiveSharpenAmountCommit = useCallback((value: number) => {
    recordHistory(`Set Selective Sharpen Amount to ${value}`, { ...currentEditState, selectiveSharpenAmount: value }, layers);
  }, [currentEditState, layers, recordHistory]);


  return { 
    selectiveBlurMask, 
    selectiveSharpenMask, 
    handleSelectiveRetouchStrokeEnd, 
    applyPreset,
    onSelectiveBlurAmountCommit,
    onSelectiveSharpenAmountCommit,
  };
};