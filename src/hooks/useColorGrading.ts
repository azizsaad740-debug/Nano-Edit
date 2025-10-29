import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';

export const useColorGrading = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const grading = currentEditState.grading;

  const onGradingChange = useCallback((key: string, value: number) => {
    updateCurrentState({ grading: { ...grading, [key]: value } });
  }, [grading, updateCurrentState]);

  const onGradingCommit = useCallback((key: string, value: number) => {
    recordHistory(`Set Grading ${key} to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.grading) {
      updateCurrentState({ grading: state.grading });
    }
  }, [updateCurrentState]);

  return { grading, onGradingChange, onGradingCommit, applyPreset };
};