import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';

export const useChannels = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
) => {
  const channels = currentEditState.channels;

  const onChannelChange = useCallback((channel: 'r' | 'g' | 'b', value: boolean) => {
    updateCurrentState({ channels: { ...channels, [channel]: value } });
    recordHistory(`Toggle Channel ${channel.toUpperCase()}`, currentEditState, layers);
  }, [channels, updateCurrentState, recordHistory, currentEditState, layers]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.channels) {
      updateCurrentState({ channels: state.channels });
    }
  }, [updateCurrentState]);

  return { channels, onChannelChange, applyPreset };
};