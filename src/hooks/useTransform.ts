import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';
import { showSuccess } from '@/utils/toast';

export const useTransform = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const transforms = currentEditState.transforms;
  const rotation = transforms.rotation;

  const onTransformChange = useCallback((transformType: string) => {
    let newTransforms = { ...transforms };
    let historyName = "";

    if (transformType === 'rotate-right') {
      newTransforms.rotation = (rotation + 90) % 360;
      historyName = "Rotate 90° Right";
    } else if (transformType === 'rotate-left') {
      newTransforms.rotation = (rotation - 90) % 360;
      historyName = "Rotate 90° Left";
    } else if (transformType === 'flip-horizontal') {
      newTransforms.scaleX = newTransforms.scaleX === 1 ? -1 : 1;
      historyName = "Flip Horizontal";
    } else if (transformType === 'flip-vertical') {
      newTransforms.scaleY = newTransforms.scaleY === 1 ? -1 : 1;
      historyName = "Flip Vertical";
    }

    updateCurrentState({ transforms: newTransforms });
    recordHistory(historyName, currentEditState, layers);
  }, [rotation, transforms, updateCurrentState, recordHistory, currentEditState, layers]);

  const onRotationChange = useCallback((value: number) => {
    updateCurrentState({ transforms: { ...transforms, rotation: value } });
  }, [transforms, updateCurrentState]);

  const onRotationCommit = useCallback((value: number) => {
    recordHistory(`Set Rotation to ${Math.round(value)}°`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.transforms) {
      updateCurrentState({ transforms: state.transforms });
    }
  }, [updateCurrentState]);

  return { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset };
};