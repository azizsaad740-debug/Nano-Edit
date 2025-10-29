import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';
import type { Crop } from 'react-image-crop';

export const useCrop = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const crop = currentEditState.crop;
  const aspect = crop ? (crop.width / crop.height) : undefined;

  const onCropChange = useCallback((newCrop: Crop) => {
    updateCurrentState({ crop: { ...newCrop, unit: '%' } });
  }, [updateCurrentState]);

  const onCropComplete = useCallback((newCrop: Crop) => {
    updateCurrentState({ crop: { ...newCrop, unit: '%' } });
    recordHistory("Crop Applied", currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  const onAspectChange = useCallback((newAspect: number | undefined) => {
    // In a real app, this would trigger a new crop selection box with the aspect ratio locked.
    // Here, we just store the aspect ratio preference.
    console.log("Aspect ratio changed (stub):", newAspect);
  }, []);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.crop) {
      updateCurrentState({ crop: state.crop });
    }
  }, [updateCurrentState]);

  return { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset };
};