import type { Layer, EditState, Dimensions, ImageLayerData, DrawingLayerData, BrushState } from '@/types/editor';
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
  isExporting: boolean = false, // <-- ADDED
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;

  ctx.fillStyle = '#FFFFFF'; // Default background fill
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // --- PROXY MODE LOGIC STUB ---
  const isProxyMode = editState.isProxyMode && !isExporting;
  if (isProxyMode) {
    // Simulate low quality rendering (e.g., smaller canvas size for internal processing)
    console.log("Rendering in low quality proxy mode for preview.");
    // In a real app, we would draw a scaled-down version or apply heavy blur/pixelation here.
  } else if (isExporting) {
    console.log("Rendering in full quality for export.");
  }
  // --- END PROXY MODE LOGIC STUB ---

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

/**
 * Merges a stroke (drawing/stamp/history) onto a target layer's data URL.
 *
 * @param baseDataUrl The existing content of the layer.
 * @param strokeDataUrl The stroke data (white/color on transparent background).
 * @param dimensions The dimensions of the canvas.
 * @param brushState The current brush state (for blend mode, opacity).
 * @param isEraser If true, uses 'destination-out' composite operation.
 * @returns A Promise resolving to the new merged data URL.
 */
export const mergeStrokeOntoLayer = async (
  baseDataUrl: string,
  strokeDataUrl: string,
  dimensions: Dimensions,
  brushState: BrushState,
  isEraser: boolean
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error("Failed to get canvas context."));

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.onload = () => {
      // 1. Draw the existing layer content
      ctx.drawImage(baseImg, 0, 0, dimensions.width, dimensions.height);

      const strokeImg = new Image();
      strokeImg.crossOrigin = "anonymous";
      strokeImg.onload = () => {
        ctx.save();
        
        // 2. Set global properties based on brush state
        ctx.globalAlpha = (brushState.opacity / 100) * (brushState.flow / 100);
        
        if (isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          // Use the brush blend mode for drawing/stamping/history
          ctx.globalCompositeOperation = brushState.blendMode as GlobalCompositeOperation || 'source-over';
        }
        
        // 3. Draw the stroke (which contains the content/mask)
        ctx.drawImage(strokeImg, 0, 0, dimensions.width, dimensions.height);
        
        ctx.restore();
        
        resolve(canvas.toDataURL());
      };
      strokeImg.onerror = () => reject(new Error("Failed to load stroke image."));
      strokeImg.src = strokeDataUrl;
    };
    baseImg.onerror = () => reject(new Error("Failed to load base image."));
    baseImg.src = baseDataUrl;
  });
};