import { useState, useCallback, useMemo } from 'react';
import type { EditState, Layer } from '@/types/editor';

export const useTransform = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[]
) => {
  // Use 'transform' property
  const transform = useMemo(() => currentEditState.transform, [currentEditState.transform]);
  const rotation = useMemo(() => currentEditState.rotation, [currentEditState.rotation]);

  // Internal function to apply general transform state updates
  const onTransformStateChange = useCallback((updates: Partial<typeof transform>) => {
    updateCurrentState({ transform: { ...currentEditState.transform, ...updates } });
  }, [currentEditState.transform, updateCurrentState]);

  // Public function matching the UI signature (accepts string commands)
  const onTransformChange = useCallback((transformType: string) => {
    let updates: Partial<typeof transform> = {};
    let historyName = '';

    if (transformType === 'flip-horizontal') {
      updates.scaleX = (transform.scaleX || 1) * -1;
      historyName = 'Flip Horizontal';
    } else if (transformType === 'flip-vertical') {
      updates.scaleY = (transform.scaleY || 1) * -1;
      historyName = 'Flip Vertical';
    } else if (transformType === 'rotate-right') {
      const newRotation = (rotation + 90) % 360;
      updateCurrentState({ rotation: newRotation });
      historyName = 'Rotate 90° Clockwise';
    } else if (transformType === 'rotate-left') {
      const newRotation = (rotation - 90 + 360) % 360;
      updateCurrentState({ rotation: newRotation });
      historyName = 'Rotate 90° Counter-Clockwise';
    } else {
      return;
    }

    if (Object.keys(updates).length > 0) {
      onTransformStateChange(updates);
    }
    
    // Record history for discrete actions
    if (historyName) {
        recordHistory(historyName, currentEditState, layers);
    }

  }, [transform, rotation, updateCurrentState, recordHistory, currentEditState, layers]);

  const onRotationChange = useCallback((newRotation: number) => {
    updateCurrentState({ rotation: newRotation });
  }, [updateCurrentState]);

  const onRotationCommit = useCallback((newRotation: number) => {
    recordHistory(`Rotate to ${newRotation}°`, { ...currentEditState, rotation: newRotation }, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.transform) {
      onTransformStateChange(state.transform);
    }
    if (state.rotation !== undefined) {
      updateCurrentState({ rotation: state.rotation });
    }
  }, [updateCurrentState, onTransformStateChange]);

  return { transforms: transform, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset };
};