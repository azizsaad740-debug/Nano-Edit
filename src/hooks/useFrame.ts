import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';

interface UseFrameProps {
  currentEditState: EditState;
  updateCurrentState: (updates: Partial<EditState>) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  layers: Layer[];
}

export const useFrame = ({ currentEditState, updateCurrentState, recordHistory, layers }: UseFrameProps) => {
  const frame = currentEditState.frame;

  const onFramePresetChange = useCallback((type: string, name: string, options?: { width: number; color: string }) => {
    if (type === 'none') {
      updateCurrentState({ frame: { type: 'none', width: 0, color: '#000000' } });
    } else if (options) {
      // Assuming 'solid' was intended to mean a border frame
      updateCurrentState({ frame: { type: 'border', width: options.width, color: options.color } });
    }
    recordHistory(`Applied Frame Preset: ${name}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  const onFramePropertyChange = useCallback((key: 'width' | 'color', value: any) => {
    // Ensure type is 'border' if properties are being changed
    updateCurrentState({ frame: { ...frame, type: 'border', [key]: value } });
  }, [frame, updateCurrentState]);

  const onFramePropertyCommit = useCallback(() => {
    recordHistory("Adjusted Frame Properties", currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.frame) {
      updateCurrentState({ frame: state.frame });
    }
  }, [updateCurrentState]);

  return { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset };
};