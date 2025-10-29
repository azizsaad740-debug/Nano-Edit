import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';

interface UseChannelsProps {
  currentEditState: EditState;
  updateCurrentState: (updates: Partial<EditState>) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  layers: Layer[];
}

export const useChannels = ({ currentEditState, updateCurrentState, recordHistory, layers }: UseChannelsProps) => {
  const channels = currentEditState.channels; // FIX 1

  const onChannelChange = useCallback((channel: 'r' | 'g' | 'b', value: boolean) => {
    updateCurrentState({ channels: { ...channels, [channel]: value } }); // FIX 2
    recordHistory(`Toggle Channel ${channel.toUpperCase()}`, currentEditState, layers);
  }, [channels, updateCurrentState, recordHistory, currentEditState, layers]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.channels) { // FIX 3
      updateCurrentState({ channels: state.channels }); // FIX 4, 5
    }
    recordHistory("Applied Channel Preset", currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  return {
    channels,
    onChannelChange,
    applyPreset,
  };
};