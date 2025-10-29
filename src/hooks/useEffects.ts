import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';

export const useEffects = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const effects = currentEditState.effects;

  const onEffectChange = useCallback((key: string, value: number) => {
    updateCurrentState({ effects: { ...effects, [key]: value } });
  }, [effects, updateCurrentState]);

  const onEffectCommit = useCallback((key: string, value: number) => {
    recordHistory(`Set Effect ${key} to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.effects) {
      updateCurrentState({ effects: state.effects });
    }
  }, [updateCurrentState]);

  return { effects, onEffectChange, onEffectCommit, applyPreset };
};