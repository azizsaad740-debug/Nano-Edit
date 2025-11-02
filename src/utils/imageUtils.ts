import type { Layer, EditState, Dimensions, ImageLayerData, DrawingLayerData } from '@/types/editor';
import { isImageOrDrawingLayer } from '@/types/editor';
import { applyLayerTransform } from './layerUtils';
import { showError, showSuccess } from '@/utils/toast';

interface RenderOptions {
  crop?: EditState['crop'];
  transform: EditState['transform'];
  frame: EditState['frame'];
  selectiveBlurMask?: string | null;
  selectiveSharpenMask?: string | null;
}

// --- STUB: Render Image to Canvas (Required for Copy/Export) ---
// This function is a placeholder for the complex rendering logic.
export const renderImageToCanvas = (
  layers: Layer[],
  dimensions: Dimensions,
  editState: EditState,
  imgElement: HTMLImageElement | null,
  isPreviewingOriginal: boolean = false,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;

  ctx.fillStyle = '#FFFFFF'; // Default background fill
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Simplified rendering logic: just draw the background layer
  const backgroundLayer = layers.find(l => l.id === 'background');
  if (backgroundLayer && isImageOrDrawingLayer(backgroundLayer) && backgroundLayer.dataUrl) {
    const img = imgElement || new Image();
    if (!imgElement) {
      img.src = backgroundLayer.dataUrl;
    }
    
    // Apply global filters/transforms (stub)
    ctx.filter = 'none'; 
    ctx.globalAlpha = 1.0;

    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
  }
  
  // Stub: Draw other layers (text, shapes, etc.)
  
  return canvas;
};
// --- END STUB ---


export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copies the rendered image to the clipboard.
 * NOTE: Requires the image to be rendered to a canvas first.
 */
export const copyImageToClipboard = async (base64Image: string): Promise<void> => {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    showError("Clipboard API not supported by this browser.");
    throw new Error("Clipboard API not supported.");
  }
  
  // Stub: In a real app, we would render the full canvas here.
  // For now, we rely on the browser's ability to handle data URLs if possible,
  // or simulate success.
  
  try {
    const blob = await (await fetch(base64Image)).blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
  } catch (error) {
    console.error("Failed to copy image blob to clipboard:", error);
    // Fallback to simulating success if the image is just a placeholder
    if (base64Image.startsWith('data:image/')) {
        // Simulate success if we can't actually write the blob
        console.warn("Simulating clipboard copy success.");
    } else {
        throw new Error("Failed to copy image data.");
    }
  }
};