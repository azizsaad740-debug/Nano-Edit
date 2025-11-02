import { useCallback } from 'react';
import type { Layer, EditState, HistoryItem, NewProjectSettings, ImageLayerData, DrawingLayerData } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import { loadProjectFromFile } from '@/utils/projectUtils';
import ExifReader from 'exifreader';

export const useImageLoader = (
  setImage: (image: string | null) => void,
  setDimensions: (dimensions: { width: number; height: number } | null) => void,
  setFileInfo: (info: { name: string; size: number } | null) => void,
  setExifData: (data: any) => void,
  setLayers: (layers: Layer[]) => void,
  resetAllEdits: () => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  setCurrentEditState: (state: EditState) => void,
  currentEditState: EditState,
  initialEditState: EditState,
  initialLayerState: Layer[],
  setSelectedLayerId: (id: string | null) => void,
  clearSelectionState: () => void,
) => { // Fix 45
  const handleImageLoad = useCallback((file: File) => {
// ... (rest of file)