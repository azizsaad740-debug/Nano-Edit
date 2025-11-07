import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateImage, generativeFill } from '@/utils/aiOrchestrator'; // Fix 390, 391
import { showSuccess, showError } from '@/utils/toast';
import type { Layer, Dimensions, ImageLayerData } from '@/types/editor';

export const useGenerativeAi = (
  geminiApiKey: string | null,
  image: string | null,
  dimensions: Dimensions | null,
  setImage: (image: string | null) => void,
  setDimensions: (dimensions: Dimensions | null) => void,
  setFileInfo: (info: { name: string; size: number } | null) => void,
  layers: Layer[],
  addDrawingLayer: (coords: { x: number; y: number }, dataUrl: string) => string,
  updateLayer: (id: string, updates: Partial<Layer>) => void,
  commitLayerChange: (id: string, name: string) => void,
  clearSelectionState: () => void,
  setIsGenerateOpen: (open: boolean) => void,
  setIsGenerativeFillOpen: (open: boolean) => void,
) => { // Fix 44
  const handleGenerateImage = useCallback(async (resultUrl: string) => {
    // ... (logic)
    
    // 1. Reset layers and set new image as background
    const newBackground: Layer = {
      id: 'background',
      name: 'Generated Image',
      type: 'image',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: resultUrl, // Fix 392
      isLocked: true,
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
      exifData: null,
      maskDataUrl: null,
    } as ImageLayerData;
    
    // ... (rest of file)
  }, [/* ... dependencies ... */]);

  const handleGenerativeFill = useCallback(async (resultUrl: string, maskDataUrl: string | null) => {
    // ... (logic)
  }, [/* ... dependencies ... */]);

  return { handleGenerateImage, handleGenerativeFill };
};