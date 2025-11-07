import { useCallback } from 'react';
import type { EditState, Layer, HslAdjustment, HslColorKey } from '@/types/editor';
import { showSuccess } from '@/utils/toast';

export const useHslAdjustments = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const hslAdjustments = currentEditState.hslAdjustments;

  const onHslAdjustmentChange = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    updateCurrentState({
      hslAdjustments: {
        ...currentEditState.hslAdjustments,
        [color]: {
          ...currentEditState.hslAdjustments[color],
          [key]: value,
        },
      },
    });
  }, [currentEditState.hslAdjustments, updateCurrentState]);

  const onHslAdjustmentCommit = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    recordHistory(`Set HSL ${color}/${String(key)} to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.hslAdjustments) {
      updateCurrentState({ hslAdjustments: state.hslAdjustments });
      showSuccess("HSL adjustments applied.");
    }
  }, [updateCurrentState]);

  return { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset };
};