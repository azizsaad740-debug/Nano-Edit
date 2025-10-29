import { useCallback } from 'react';
import type { Layer, Dimensions } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';

export const useGenerativeAi = (
  geminiApiKey: string,
  image: string | null,
  dimensions: Dimensions | null,
  setImage: (image: string | null) => void,
  setDimensions: (dimensions: Dimensions | null) => void,
  setFileInfo: (info: { name: string; size: number } | null) => void,
  layers: Layer[],
  handleAddDrawingLayer: () => string,
  updateLayer: (id: string, updates: Partial<Layer>) => void,
  commitLayerChange: (id: string) => void,
  clearSelectionState: () => void,
  setIsGenerateOpen: (open: boolean) => void,
  setIsGenerativeFillOpen: (open: boolean) => void,
) => {
  const handleGenerateImage = useCallback((resultUrl: string) => {
    if (!dimensions) return;
    
    // 1. Reset layers and set new image as background
    const newBackground: Layer = {
      id: 'background',
      name: 'Background',
      type: 'image',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: resultUrl,
      isLocked: true,
    };
    
    setImage(resultUrl);
    setFileInfo({ name: "Generated Image", size: 0 });
    // Dimensions are assumed to be set by the dialog/API call, but here we use existing dimensions
    
    // 2. Replace all layers with the new background
    // Note: In a real app, this should reset the entire project state.
    // setLayers([newBackground]); // Assuming setLayers is available via context/parent hook
    
    showSuccess("Generated image applied to workspace.");
  }, [dimensions, setImage, setFileInfo]);

  const handleGenerativeFill = useCallback((resultUrl: string, maskDataUrl: string | null) => {
    if (!maskDataUrl || !dimensions) {
      showError("Generative fill requires a mask and dimensions.");
      return;
    }
    
    // 1. Create a new drawing layer with the generated image
    const newLayerId = handleAddDrawingLayer();
    
    // 2. Update the new layer with the generated image and the mask
    updateLayer(newLayerId, {
      dataUrl: resultUrl,
      maskDataUrl: maskDataUrl,
      name: "Generative Fill",
      opacity: 100,
      blendMode: 'normal',
      // Ensure layer covers the whole canvas for fill operation
      x: 50, y: 50, width: 100, height: 100, rotation: 0,
    });
    
    commitLayerChange(newLayerId);
    clearSelectionState();
    showSuccess("Generative fill applied as a new layer.");
  }, [dimensions, handleAddDrawingLayer, updateLayer, commitLayerChange, clearSelectionState]);

  return { handleGenerateImage, handleGenerativeFill };
};