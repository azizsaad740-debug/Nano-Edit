import { type Crop } from 'react-image-crop';
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { EditState, Layer } from '@/hooks/useEditorState';
import { getFilterString } from './filterUtils';
import { rasterizeLayerToCanvas } from './layerUtils'; // Import the utility
import { upscaleImageApi } from "./stabilityApi"; // NEW import

interface ImageOptions extends EditState {
  image: HTMLImageElement;
  layers: Layer[];
}

/**
 * Calculates the CSS filter string for a single adjustment layer.
 * This is a simplified version of getFilterString, only using the adjustment layer's data.
 */
const getAdjustmentFilterString = (layer: Layer): string => {
  if (!layer.adjustmentData) return '';
  
  const { type, adjustments, curves, hslAdjustments, grading } = layer.adjustmentData;
  
  let filters: string[] = [];

  if (type === 'brightness' && adjustments) {
    filters.push(`brightness(${adjustments.brightness}%)`);
    filters.push(`contrast(${adjustments.contrast}%)`);
    filters.push(`saturate(${adjustments.saturation}%)`);
  }

  if (type === 'grading' && grading) {
    filters.push(`grayscale(${grading.grayscale}%)`);
    filters.push(`sepia(${grading.sepia}%)`);
    filters.push(`invert(${grading.invert}%)`);
  }

  // If HSL is adjusted globally, we can apply hue-rotate and saturation/luminance via CSS filters
  if (type === 'hsl' && hslAdjustments?.global) {
    const globalHsl = hslAdjustments.global;
    const saturationValue = globalHsl.saturation / 100;
    const brightnessAdjustment = 1 + (globalHsl.luminance / 100);
    
    filters.push(`hue-rotate(${globalHsl.hue}deg)`);
    filters.push(`saturate(${saturationValue})`);
    filters.push(`brightness(${brightnessAdjustment})`);
  }
  
  // Note: Curves are not supported via simple CSS filters, so we skip them here.

  return filters.filter(Boolean).join(' ');
};

/**
 * Calculates the combined filter string from all adjustment layers above the given index.
 */
const getAdjustmentFiltersAbove = (layers: Layer[], index: number): string => {
    let filters: string[] = [];
    // Iterate over layers above the current index (i+1 to N)
    for (let j = index + 1; j < layers.length; j++) {
        const layer = layers[j];
        if (layer.type === 'adjustment' && layer.visible) {
            const adjustmentFilter = getAdjustmentFilterString(layer);
            if (adjustmentFilter) {
                filters.push(adjustmentFilter);
            }
        }
    }
    return filters.join(' ');
};


export const getEditedImageCanvas = async (options: ImageOptions): Promise<HTMLCanvasElement | null> => {
  const {
    image,
    layers,
    crop,
    transforms,
    frame,
    colorMode,
    selectiveBlurMask,
    selectiveBlurAmount,
  } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelCrop = (crop && crop.width > 0)
    ? {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
      }
    : {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

  const { rotation } = transforms;
  const isSwapped = rotation === 90 || rotation === 270;
  canvas.width = isSwapped ? pixelCrop.height : pixelCrop.width;
  canvas.height = isSwapped ? pixelCrop.width : pixelCrop.height;

  // Determine if any adjustment layers exist to disable global filters
  const hasAdjustmentLayers = layers.some(l => l.type === 'adjustment');

  // Apply global filters (from EditState) only if no adjustment layers are present
  let globalFilter = '';
  if (!hasAdjustmentLayers) {
    globalFilter = getFilterString({ 
      adjustments: options.adjustments, 
      effects: options.effects, 
      grading: options.grading, 
      selectedFilter: options.selectedFilter, 
      hslAdjustments: options.hslAdjustments,
    });
  }
  
  // Apply color mode filter
  let colorModeFilter = '';
  if (colorMode === 'Grayscale') {
    colorModeFilter = ' grayscale(1)';
  } else if (colorMode === 'CMYK') {
    colorModeFilter = ' invert(1) hue-rotate(180deg) sepia(0.1) saturate(1.1)';
  }
  
  ctx.filter = colorModeFilter; // Start with color mode filter

  // We need to store the rasterized content of the layer immediately below the current one
  // for clipping mask purposes.
  let baseLayerCanvas: HTMLCanvasElement | null = null; 

  // --- Rasterization Loop (Bottom-Up) ---
  // Iterate from bottom layer (index 0) to top layer (index N-1)
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    
    // 1. Handle Adjustment Layers: Skip drawing them, their effect is applied to layers below them (already drawn)
    // or layers above them (applied during rasterization of content layers).
    if (layer.type === 'adjustment') {
      // Adjustment layers do not produce a canvas to be clipped by or drawn directly.
      baseLayerCanvas = null;
      continue;
    }

    // Skip layers that are not visible
    if (!layer.visible) {
        baseLayerCanvas = null;
        continue;
    }

    // 2. Determine the filter to apply to this layer
    // Apply global filters (if no adjustment layers) + adjustment filters from layers ABOVE this one.
    const adjustmentFiltersAbove = getAdjustmentFiltersAbove(layers, i);
    const currentLayerFilter = globalFilter + adjustmentFiltersAbove;

    let layerCanvas: HTMLCanvasElement | null = null;
    
    if (layer.type === 'image') {
        // Handle the main background image layer
        
        ctx.save();
        ctx.filter = currentLayerFilter + colorModeFilter;
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(transforms.rotation * Math.PI / 180);
        ctx.scale(transforms.scaleX, transforms.scaleY);
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          -pixelCrop.width / 2,
          -pixelCrop.height / 2,
          pixelCrop.width,
          pixelCrop.height
        );
        ctx.restore();
        ctx.filter = colorModeFilter; // Reset filter for subsequent layers
        
        // Create a canvas of the drawn background for clipping mask reference
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        bgCanvas.getContext('2d')?.drawImage(canvas, 0, 0);
        baseLayerCanvas = bgCanvas;
        continue;
    }

    // 3. Rasterize the current layer (text, drawing, smart-object, etc.)
    layerCanvas = await rasterizeLayerToCanvas(layer, { width: canvas.width, height: canvas.height });
    if (!layerCanvas) {
        baseLayerCanvas = null;
        continue;
    }

    // 4. Apply current filter stack to the layer canvas
    if (currentLayerFilter) {
      const tempFilteredCanvas = document.createElement('canvas');
      tempFilteredCanvas.width = canvas.width;
      tempFilteredCanvas.height = canvas.height;
      const tempFilteredCtx = tempFilteredCanvas.getContext('2d');
      if (tempFilteredCtx) {
        tempFilteredCtx.filter = currentLayerFilter;
        tempFilteredCtx.drawImage(layerCanvas, 0, 0);
        layerCanvas = tempFilteredCanvas;
      }
    }

    // 5. Check for Clipping Mask
    // Layer A (layerCanvas) is the layer being drawn.
    // Layer B (baseLayerCanvas) is the layer below it.
    
    const isClipped = layer.isClippingMask;
    
    if (isClipped) {
        // Layer A is clipped by Layer B
        
        if (baseLayerCanvas) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                // 1. Draw the clipping layer (Layer A)
                tempCtx.drawImage(layerCanvas, 0, 0);
                
                // 2. Use the base layer (Layer B) as the clipping shape (destination-in)
                // Note: We use the content of Layer B (baseLayerCanvas) as the mask.
                tempCtx.globalCompositeOperation = 'destination-in';
                tempCtx.drawImage(baseLayerCanvas, 0, 0);
                
                // 3. Draw the result onto the main canvas
                ctx.globalAlpha = (layer.opacity ?? 100) / 100;
                ctx.globalCompositeOperation = (layer.blendMode || 'normal') as GlobalCompositeOperation;
                ctx.drawImage(tempCanvas, 0, 0);
            }
        } else {
            // If there is no base layer canvas (e.g., layer below was invisible or adjustment), draw normally
            ctx.globalAlpha = (layer.opacity ?? 100) / 100;
            ctx.globalCompositeOperation = (layer.blendMode || 'normal') as GlobalCompositeOperation;
            ctx.drawImage(layerCanvas, 0, 0);
        }
        
    } else {
        // 6. Normal drawing
        ctx.globalAlpha = (layer.opacity ?? 100) / 100;
        ctx.globalCompositeOperation = (layer.blendMode || 'normal') as GlobalCompositeOperation;
        ctx.drawImage(layerCanvas, 0, 0);
    }
    
    // 7. Update baseLayerCanvas for the next iteration (Layer A becomes Layer B for the layer above it)
    baseLayerCanvas = layerCanvas;
  }
  
  ctx.globalAlpha = 1.0; // Reset global alpha
  ctx.globalCompositeOperation = 'source-over'; // Reset composite operation

  // Apply global effects (Vignette, Noise, Sharpen, Clarity)
  // Note: Selective Blur requires SVG filters, which cannot be applied to the context
  // after drawing. For now, we rely on the Workspace component to apply the SVG filter
  // to the main image element, and we skip it here for rasterization.
  
  // Apply Vignette (Canvas API)
  if (options.effects.vignette > 0) {
    const outerRadius = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2;
    const innerRadius = outerRadius * (1 - (options.effects.vignette / 100) * 1.2);
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, innerRadius,
        canvas.width / 2, canvas.height / 2, outerRadius
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${options.effects.vignette / 100 * 0.7})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Apply Frame (Canvas API)
  if (frame && frame.type === 'solid' && frame.width > 0) {
    const frameWidth = frame.width;
    const framedCanvas = document.createElement('canvas');
    framedCanvas.width = canvas.width + frameWidth * 2;
    framedCanvas.height = canvas.height + frameWidth * 2;
    const frameCtx = framedCanvas.getContext('2d');
    if (frameCtx) {
      frameCtx.fillStyle = frame.color;
      frameCtx.fillRect(0, 0, framedCanvas.width, framedCanvas.height);
      frameCtx.drawImage(canvas, frameWidth, frameWidth);
      return framedCanvas;
    }
  }

  return canvas;
};

/**
 * Rasterizes the fully edited image (including all layers and effects) 
 * and clips it using the provided selection mask.
 *
 * @param options ImageOptions including layers and edit state.
 * @param selectionMaskDataUrl The data URL of the selection mask.
 * @returns A Promise resolving to a data URL of the clipped image.
 */
export const rasterizeEditedImageWithMask = async (
  options: ImageOptions,
  selectionMaskDataUrl: string
): Promise<string> => {
  const fullCanvas = await getEditedImageCanvas(options);
  if (!fullCanvas) throw new Error("Failed to rasterize full image.");

  const { width, height } = fullCanvas;
  const ctx = fullCanvas.getContext('2d');
  if (!ctx) throw new Error("Failed to get canvas context.");

  // 1. Load the mask
  const maskImage = new Image();
  await new Promise((resolve, reject) => {
    maskImage.onload = resolve;
    maskImage.onerror = reject;
    maskImage.src = selectionMaskDataUrl;
  });

  // 2. Use a temporary canvas to apply the mask
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error("Failed to get temporary canvas context.");

  // Draw the full edited image onto the temp canvas
  tempCtx.drawImage(fullCanvas, 0, 0);

  // Apply the mask using destination-in
  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.drawImage(maskImage, 0, 0, width, height);
  
  return tempCanvas.toDataURL('image/png');
};

export const copyImageToClipboard = async (options: ImageOptions) => {
  const canvas = await getEditedImageCanvas(options);
  if (!canvas) return;

  canvas.toBlob(async (blob) => {
    if (blob) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showSuccess("Image copied to clipboard.");
      } catch (err) {
        console.error("Failed to copy image: ", err);
        showError("Failed to copy image to clipboard.");
      }
    } else {
      showError("Failed to create image blob.");
    }
  }, 'image/png');
};

export const downloadImage = async (
  options: ImageOptions, 
  exportOptions: { 
    format: string; 
    quality: number; 
    width: number; 
    height: number; 
    upscale: 1 | 2 | 4;
  },
  stabilityApiKey: string
) => {
  let { format, quality, width, height, upscale } = exportOptions;
  
  // Normalize format and handle stubs
  let mimeType: string;
  let fileExtension: string;
  
  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      mimeType = 'image/jpeg';
      fileExtension = 'jpg';
      break;
    case 'webp':
      mimeType = 'image/webp';
      fileExtension = 'webp';
      break;
    case 'png':
      mimeType = 'image/png';
      fileExtension = 'png';
      break;
    case 'svg':
    case 'pdf':
    case 'tiff':
    case 'gif':
      // Stub: Fallback to PNG/JPEG for unsupported formats
      showError(`Export to ${format.toUpperCase()} is a stub. Exporting as PNG instead.`);
      mimeType = 'image/png';
      fileExtension = 'png';
      format = 'png';
      upscale = 1; // Disable upscale for stub fallback
      quality = 1.0;
      break;
    default:
      mimeType = 'image/png';
      fileExtension = 'png';
      format = 'png';
  }

  const sourceCanvas = await getEditedImageCanvas(options);
  if (!sourceCanvas) return;

  let finalCanvas = sourceCanvas;
  let finalDataUrl = sourceCanvas.toDataURL('image/png');
  const toastId = showLoading("Preparing image for download...");

  try {
    if (upscale > 1) {
      dismissToast(toastId);
      const upscaleToastId = showLoading(`Upscaling image by ${upscale}x using Stability AI...`);
      
      // Fix: Only call upscaleImageApi if upscale is 2 or 4
      if (upscale === 2 || upscale === 4) {
        finalDataUrl = await upscaleImageApi(finalDataUrl, stabilityApiKey, upscale);
      } else {
        // Should not happen based on ExportOptions, but safe guard
        dismissToast(upscaleToastId);
        throw new Error("Invalid upscale factor.");
      }
      
      const upscaledImg = new Image();
      await new Promise((resolve, reject) => {
        upscaledImg.onload = resolve;
        upscaledImg.onerror = reject;
        upscaledImg.src = finalDataUrl;
      });
      
      const upscaledCanvas = document.createElement('canvas');
      upscaledCanvas.width = upscaledImg.naturalWidth;
      upscaledCanvas.height = upscaledImg.naturalHeight;
      upscaledCanvas.getContext('2d')?.drawImage(upscaledImg, 0, 0);
      finalCanvas = upscaledCanvas;
      
      dismissToast(upscaleToastId);
      showSuccess(`Upscale to ${upscale}x complete.`);
    }

    // Handle final resizing if manual dimensions were set (only possible if upscale was 1)
    if (upscale === 1 && width > 0 && height > 0 && (width !== finalCanvas.width || height !== finalCanvas.height)) {
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = width;
      resizedCanvas.height = height;
      const ctx = resizedCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(finalCanvas, 0, 0, width, height);
        finalCanvas = resizedCanvas;
      }
    }
    
    // Final download step
    const link = document.createElement('a');
    link.download = `edited-image.${fileExtension}`;
    link.href = finalCanvas.toDataURL(mimeType, quality);
    link.click();
    
    if (upscale === 1) dismissToast(toastId);
    showSuccess("Image downloaded successfully.");
    
  } catch (error) {
    console.error("Export failed:", error);
    dismissToast(toastId);
    showError("Export failed. Check API key or console for details.");
  }
};

export const downloadSelectionAsImage = async (
  imageElement: HTMLImageElement,
  selectionMaskDataUrl: string,
  dimensions: { width: number; height: number },
  fileName: string = 'selection.png'
) => {
  const toastId = showLoading("Exporting selection...");
  try {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Failed to get canvas context.");

    // 1. Draw the full image (including all layers) onto a temporary canvas
    // Since we only have the imageElement here, we need to draw the fully edited image first.
    // If the user wants layers included, they should use the full export after cropping.
    
    // Draw the base image
    ctx.drawImage(imageElement, 0, 0, dimensions.width, dimensions.height);

    // 2. Load the mask
    const maskImage = new Image();
    await new Promise((resolve, reject) => {
      maskImage.onload = resolve;
      maskImage.onerror = reject;
      maskImage.src = selectionMaskDataUrl;
    });

    // 3. Apply the mask using destination-in
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskImage, 0, 0, dimensions.width, dimensions.height);
    
    // 4. Find the bounding box of the selected area
    const imageData = ctx.getImageData(0, 0, dimensions.width, dimensions.height);
    const data = imageData.data;
    
    let minX = dimensions.width, minY = dimensions.height, maxX = 0, maxY = 0;
    let foundPixel = false;

    for (let y = 0; y < dimensions.height; y++) {
      for (let x = 0; x < dimensions.width; x++) {
        const i = (y * dimensions.width + x) * 4;
        if (data[i + 3] > 0) { // Check alpha channel
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          foundPixel = true;
        }
      }
    }

    if (!foundPixel) {
      dismissToast(toastId);
      showError("Selection is empty.");
      return;
    }

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    
    if (croppedCtx) {
        croppedCtx.putImageData(
            ctx.getImageData(minX, minY, croppedWidth, croppedHeight),
            0, 0
        );
    } else {
        throw new Error("Failed to create cropped canvas context.");
    }

    // 5. Download the cropped image
    const link = document.createElement('a');
    link.download = fileName;
    link.href = croppedCanvas.toDataURL('image/png');
    link.click();

    dismissToast(toastId);
    showSuccess("Selection exported successfully.");

  } catch (error) {
    console.error("Export selection failed:", error);
    dismissToast(toastId);
    showError("Export selection failed.");
  }
};