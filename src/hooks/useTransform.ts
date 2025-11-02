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

  const onTransformChange = useCallback((updates: Partial<typeof transform>) => {
    updateCurrentState({ transform: { ...currentEditState.transform, ...updates } });
  }, [currentEditState.transform, updateCurrentState]);

  const onRotationChange = useCallback((newRotation: number) => {
    updateCurrentState({ rotation: newRotation });
  }, [updateCurrentState]);

  const onRotationCommit = useCallback((newRotation: number) => {
    recordHistory(`Rotate to ${newRotation}°`, { ...currentEditState, rotation: newRotation }, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.transform) {
      updateCurrentState({ transform: state.transform });
    }
    if (state.rotation !== undefined) {
      updateCurrentState({ rotation: state.rotation });
    }
  }, [updateCurrentState]);

  return { transforms: transform, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset };
};