import { useCallback } from 'react';
import type { EditState, Layer } from '@/types/editor';
import { showSuccess } from '@/utils/toast';

export const useProjectSettings = (
  currentEditState: EditState,
  updateCurrentState: (updates: Partial<EditState>) => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  layers: Layer[],
  dimensions: { width: number; height: number } | null,
  setDimensions: (dimensions: { width: number; height: number } | null) => void,
) => {
  const handleProjectSettingsUpdate = useCallback((updates: {
    width?: number;
    height?: number;
    colorMode?: EditState['colorMode'];
  }) => {
    let historyName = "Update Project Settings";
    
    if (updates.width !== undefined || updates.height !== undefined) {
      setDimensions({
        width: updates.width ?? dimensions?.width ?? 1,
        height: updates.height ?? dimensions?.height ?? 1,
      });
      historyName = "Resize Canvas";
    }
    
    if (updates.colorMode !== undefined) {
      updateCurrentState({ colorMode: updates.colorMode });
      historyName = "Change Color Mode";
    }
    
    recordHistory(historyName, currentEditState, layers);
  }, [currentEditState, layers, recordHistory, updateCurrentState, dimensions, setDimensions]);

  return { handleProjectSettingsUpdate };
};