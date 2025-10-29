import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';

export const useFrame = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const frame = currentEditState.frame;

  const onFramePresetChange = useCallback((type: string, name: string, options?: { width: number; color: string }) => {
    if (type === 'none') {
      updateCurrentState({ frame: { type: 'none', width: 0, color: '#000000' } });
    } else if (options) {
      updateCurrentState({ frame: { type: type as 'solid', width: options.width, color: options.color } });
    }
    recordHistory(`Apply Frame Preset: ${name}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  const onFramePropertyChange = useCallback((key: 'width' | 'color', value: any) => {
    updateCurrentState({ frame: { ...frame, type: 'solid', [key]: value } });
  }, [frame, updateCurrentState]);

  const onFramePropertyCommit = useCallback(() => {
    recordHistory("Edit Frame Properties", currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.frame) {
      updateCurrentState({ frame: state.frame });
    }
  }, [updateCurrentState]);

  return { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset };
};