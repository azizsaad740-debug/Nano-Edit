import { useCallback } from 'react';
import type { EditState, Layer, Point } from '@/types/editor';

export const useCurves = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const curves = currentEditState.curves;

  const onCurvesChange = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    updateCurrentState({ curves: { ...curves, [channel]: points } });
  }, [curves, updateCurrentState]);

  const onCurvesCommit = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    recordHistory(`Edit Curves: ${channel}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.curves) {
      updateCurrentState({ curves: state.curves });
    }
  }, [updateCurrentState]);

  return { curves, onCurvesChange, onCurvesCommit, applyPreset };
};