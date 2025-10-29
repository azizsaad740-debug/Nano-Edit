import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';

export const useAdjustments = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const adjustments = currentEditState.adjustments;
  const selectedFilter = currentEditState.selectedFilter;

  const onAdjustmentChange = useCallback((key: string, value: number) => {
    updateCurrentState({ adjustments: { ...adjustments, [key]: value } });
  }, [adjustments, updateCurrentState]);

  const onAdjustmentCommit = useCallback((key: string, value: number) => {
    recordHistory(`Set ${key} to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.adjustments) {
      updateCurrentState({ adjustments: state.adjustments });
    }
    if (state.selectedFilter !== undefined) {
      updateCurrentState({ selectedFilter: state.selectedFilter });
    }
  }, [updateCurrentState]);

  return { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, applyPreset };
};