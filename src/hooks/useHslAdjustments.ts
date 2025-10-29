import { useCallback } from 'react';
import type { EditState, Layer, HslAdjustment, HslColorKey } from '@/types/editor';

export const useHslAdjustments = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const hslAdjustments = currentEditState.hslAdjustments;

  const onHslAdjustmentChange = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    const newHsl = { 
      ...hslAdjustments, 
      [color]: { ...hslAdjustments[color], [key]: value } 
    };
    updateCurrentState({ hslAdjustments: newHsl });
  }, [hslAdjustments, updateCurrentState]);

  const onHslAdjustmentCommit = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    recordHistory(`Set HSL ${color}/${key} to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.hslAdjustments) {
      updateCurrentState({ hslAdjustments: state.hslAdjustments });
    }
  }, [updateCurrentState]);

  return { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset };
};