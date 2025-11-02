import { useState, useCallback, useMemo } from 'react';
import type { EditState, Layer, FrameState } from '@/types/editor';

export const useFrame = ({
  currentEditState,
  updateCurrentState,
  recordHistory,
  layers,
}: {
  currentEditState: EditState;
  updateCurrentState: (updates: Partial<EditState>) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  layers: Layer[];
}) => {
  const frame = useMemo(() => currentEditState.frame, [currentEditState.frame]);

  const onFramePresetChange = useCallback((type: FrameState['type'], name: string, options?: any) => {
    let frameUpdate: Partial<FrameState>;
    
    if (type === 'none') {
      frameUpdate = { 
        type: 'none', 
        color: '#000000', 
        width: 0, 
        opacity: 100, 
        roundness: 0, 
        vignetteAmount: 0, 
        vignetteRoundness: 0 
      }; // Fix 13: Provide all required properties
    } else if (options) {
      // Assuming 'solid' was intended to mean a border frame
      frameUpdate = { 
        type: 'border', 
        color: options.color, 
        width: options.width || 10, // Use width, provide default
        opacity: options.opacity || 100, 
        roundness: options.roundness || 0, 
        vignetteAmount: 0, 
        vignetteRoundness: 0 
      }; // Fix 14: Provide all required properties
    } else {
      return;
    }
    
    updateCurrentState({ frame: { ...currentEditState.frame, ...frameUpdate } });
    recordHistory(`Set Frame Preset: ${name}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState]);

  const onFramePropertyChange = useCallback((key: keyof FrameState, value: any) => {
    updateCurrentState({ frame: { ...currentEditState.frame, [key]: value } });
  }, [currentEditState.frame, updateCurrentState]);

  const onFramePropertyCommit = useCallback(() => {
    recordHistory(`Update Frame`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const applyPreset = useCallback((state: Partial<EditState>) => {
    if (state.frame) {
      updateCurrentState({ frame: state.frame });
    }
  }, [updateCurrentState]);

  return { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset };
};