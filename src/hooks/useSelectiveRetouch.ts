import { useCallback } from 'react';
import type { EditState, Layer, Dimensions } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';

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
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw existing mask
      if (targetMask) {
        const existingMask = new Image();
        await new Promise(resolve => { existingMask.onload = resolve; existingMask.src = targetMask; });
        ctx.drawImage(existingMask, 0, 0);
      }

      // 2. Draw new stroke (white for add, black for subtract)
      const strokeImg = new Image();
      await new Promise(resolve => { strokeImg.onload = resolve; strokeImg.src = strokeDataUrl; });
      
      // Use composite operations to merge masks
      if (operation === 'add') {
        ctx.globalCompositeOperation = 'source-over'; // Add white stroke
      } else {
        ctx.globalCompositeOperation = 'destination-out'; // Subtract black stroke
      }
      
      ctx.drawImage(strokeImg, 0, 0);
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      const newMaskDataUrl = canvas.toDataURL();
      
      updateCurrentState({ [maskKey]: newMaskDataUrl });
      recordHistory(`${tool === 'blurBrush' ? 'Blur' : 'Sharpen'} Mask Stroke: ${operation}`, currentEditState, layers);
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