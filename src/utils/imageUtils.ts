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

const getEditedImageCanvas = async (options: ImageOptions): Promise<HTMLCanvasElement | null> => {
  const {
    image,
    layers,
    crop,
    transforms,
    frame,
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

  // Apply base image filters and transforms to the main image layer
  const bgLayer = layers.find(l => l.type === 'image');
  if (bgLayer && bgLayer.visible) {
    ctx.filter = getFilterString(options);
    ctx.save();
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
  }

  // Draw other layers on top using the rasterize utility
  ctx.filter = 'none'; // Reset filter for layers
  for (const layer of layers) {
    if (layer.type === 'image') continue; // Skip background image, already drawn
    if (!layer.visible) continue;

    try {
      const layerCanvas = await rasterizeLayerToCanvas(layer, { width: canvas.width, height: canvas.height });
      if (layerCanvas) {
        ctx.globalAlpha = (layer.opacity ?? 100) / 100;
        ctx.globalCompositeOperation = (layer.blendMode || 'normal') as GlobalCompositeOperation;
        ctx.drawImage(layerCanvas, 0, 0);
      }
    } catch (e) {
      console.error(`Failed to rasterize layer ${layer.name} for export:`, e);
    }
  }
  ctx.globalAlpha = 1.0; // Reset global alpha

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
  const sourceCanvas = await getEditedImageCanvas(options);
  if (!sourceCanvas) return;

  const { format, quality, width, height, upscale } = exportOptions;
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
    const mimeType = `image/${format}`;
    const fileExtension = format;
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

// New function to download the selected area of the image
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
    // For simplicity and speed, we will only export the base image clipped by the mask.
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