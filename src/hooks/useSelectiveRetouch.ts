import { useCallback } from 'react';
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
  const selectiveBlurMask = currentEditState.selectiveBlurMask;
  const selectiveSharpenMask = currentEditState.selectiveSharpenMask;

  const handleSelectiveRetouchStrokeEnd = useCallback((strokeDataUrl: string, tool: 'blurBrush' | 'sharpenTool', operation: 'add' | 'subtract') => {
    if (!dimensions) return;

    const targetMask = tool === 'blurBrush' ? selectiveBlurMask : selectiveSharpenMask;
    const maskKey = tool === 'blurBrush' ? 'selectiveBlurMask' : 'selectiveSharpenMask';
    
    const mergeMask = async () => {
      try {
        const newMaskDataUrl = await mergeMasks(
          targetMask,
          strokeDataUrl,
          dimensions,
          operation
        );
        
        updateCurrentState({ [maskKey]: newMaskDataUrl });
        recordHistory(`${tool === 'blurBrush' ? 'Blur' : 'Sharpen'} Mask Stroke: ${operation}`, currentEditState, layers);
        showSuccess(`${tool === 'blurBrush' ? 'Blur' : 'Sharpen'} mask updated.`);
      } catch (error) {
        console.error("Error merging selective retouch mask:", error);
        showError(`Failed to update ${tool === 'blurBrush' ? 'blur' : 'sharpen'} mask.`);
      }
    };

    mergeMask();
  }, [dimensions, selectiveBlurMask, selectiveSharpenMask, updateCurrentState, recordHistory, currentEditState, layers]);

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

  return { 
    selectiveBlurMask, 
    selectiveSharpenMask,
    handleSelectiveRetouchStrokeEnd, 
    applyPreset 
  };
};