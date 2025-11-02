import type { Layer, EditState, Dimensions, ImageLayerData, DrawingLayerData } from '@/types/editor';
import { isImageOrDrawingLayer } from '@/types/editor'; // Fix 57
import { applyLayerTransform } from './layerUtils';

interface RenderOptions {
  crop?: EditState['crop'];
  transform: EditState['transform'];
  frame: EditState['frame']; // Fix 47
  selectiveBlurMask?: string | null;
  selectiveSharpenMask?: string | null;
}

// ... (rest of file)

export const downloadImage = (dataUrl: string, filename: string) => { // Fix 389
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};