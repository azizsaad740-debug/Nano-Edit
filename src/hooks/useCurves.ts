import { useCallback } from 'react'; // FIX 82
import type { EditState, Layer, Point } from '@/types/editor';
import { initialCurvesState } from '@/types/editor';
import { useMemo } from 'react';

interface UseCurvesProps {
  currentEditState: EditState;
  updateCurrentState: (updates: Partial<EditState>) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  layers: Layer[];
}

export const useCurves = ({ currentEditState, updateCurrentState, recordHistory, layers }: UseCurvesProps) => {
  const curves = currentEditState.curves;

  const onCurvesChange = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    updateCurrentState({ curves: { ...curves, [channel]: points } });
  }, [curves, updateCurrentState]);

  const onCurvesCommit = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    recordHistory(`Edit Curves: ${String(channel)}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((presetCurves: EditState['curves']) => {
    updateCurrentState({ curves: presetCurves });
    recordHistory("Applied Curves Preset", currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  return {
    curves,
    onCurvesChange,
    onCurvesCommit,
    applyPreset,
  };
};