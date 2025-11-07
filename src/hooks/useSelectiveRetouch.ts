import { useState, useCallback, useMemo } from 'react';
import type { EditState, Layer, Dimensions } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import { mergeMasks } from '@/utils/maskUtils';

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

  const handleSelectiveRetouchStrokeEnd = useCallback(async (strokeDataUrl: string, tool: 'blurBrush' | 'sharpenTool', operation: 'add' | 'subtract') => {
    if (!dimensions) return; // Safety check

    try {
      let existingMask: string | null;
      let maskKey: 'selectiveBlurMask' | 'selectiveSharpenMask';
      let historyName: string;

      if (tool === 'blurBrush') {
        existingMask = currentEditState.selectiveBlurMask;
        maskKey = 'selectiveBlurMask';
        historyName = `Applied Selective Blur Mask (${operation})`;
      } else if (tool === 'sharpenTool') {
        existingMask = currentEditState.selectiveSharpenMask;
        maskKey = 'selectiveSharpenMask';
        historyName = `Applied Selective Sharpen Mask (${operation})`;
      } else {
        return;
      }
      
      // 1. Merge the stroke onto the existing mask
      const newMaskDataUrl = await mergeMasks(
        existingMask,
        strokeDataUrl,
        dimensions,
        operation
      );

      // 2. Update state and record history
      updateCurrentState({ [maskKey]: newMaskDataUrl });
      recordHistory(historyName, { ...currentEditState, [maskKey]: newMaskDataUrl }, layers);
      
    } catch (error) {
      console.error("Failed to merge selective retouch mask:", error);
      showError("Failed to apply retouch stroke.");
    }
  }, [currentEditState, layers, recordHistory, updateCurrentState, dimensions]);

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