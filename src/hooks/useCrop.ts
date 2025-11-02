import { useState, useCallback, useMemo } from 'react';
import type { EditState, Layer } from '@/types/editor';

interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useCrop = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[]
) => {
  const crop = useMemo(() => currentEditState.crop, [currentEditState.crop]);
  const aspect = useMemo(() => currentEditState.aspect, [currentEditState.aspect]);

  const onCropChange = useCallback((newCrop: Crop) => {
    // Ensure aspect is included
    updateCurrentState({ crop: { ...newCrop, unit: '%', aspect: aspect } }); // Fix 11
  }, [updateCurrentState, aspect]);

  const onCropComplete = useCallback((newCrop: Crop) => {
    // Ensure aspect is included
    updateCurrentState({ crop: { ...newCrop, unit: '%', aspect: aspect } }); // Fix 12
    recordHistory("Crop Applied", currentEditState, layers);
  }, [updateCurrentState, currentEditState, layers, recordHistory, aspect]);

  const onAspectChange = useCallback((newAspect: number | null) => {
    updateCurrentState({ aspect: newAspect });
  }, [updateCurrentState]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.crop) {
      updateCurrentState({ crop: state.crop });
    }
    if (state.aspect !== undefined) {
      updateCurrentState({ aspect: state.aspect });
    }
  }, [updateCurrentState]);

  return { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset };
};