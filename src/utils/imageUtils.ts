import type { Layer, EditState, Dimensions, ImageLayerData, DrawingLayerData } from '@/types/editor';

/**
 * Options required for rasterizing the final image.
 */
export interface ImageOptions {
  layers: Layer[];
  // Added properties from EditState
  crop?: EditState['crop'];
  transforms: EditState['transforms'];
  frame: EditState['frame'];
  colorMode: EditState['colorMode'];
  selectiveBlurMask: EditState['selectiveBlurMask'];
  selectiveBlurAmount: EditState['selectiveBlurAmount'];
  adjustments: EditState['adjustments'];
  effects: EditState['effects'];
  grading: EditState['grading'];
  selectedFilter: EditState['selectedFilter'];
  hslAdjustments: EditState['hslAdjustments'];
  // ... other properties
}

/**
 * Rasterizes the entire edited image, including all layers and global adjustments,
 * into a single base64 data URL.
 *
 * @param layers The list of layers.
 * @param dimensions The dimensions of the canvas.
 * @param editState The current global edit state.
 * @param imgElement The reference to the base image element (for background layer).
 * @returns A Promise resolving to the base64 data URL of the final image.
 */
export const rasterizeEditedImageWithMask = async (
  layers: Layer[],
  dimensions: Dimensions,
  editState: EditState,
  imgElement: HTMLImageElement | null
): Promise<string> => {
  // STUB: This is a complex operation involving applying all filters, adjustments,
  // and rendering all layers onto a single canvas.
  
  // For now, we return the base image data URL if available, or a placeholder.
  const backgroundLayer = layers.find(l => l.id === 'background') as ImageLayerData | DrawingLayerData | undefined;
  const baseImageSrc = backgroundLayer?.dataUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(baseImageSrc);

    const img = new Image();
    img.onload = () => {
      // Simulate drawing the final composite image
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      
      // In a real app, we would apply all filters/layers here.
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(baseImageSrc);
    img.src = baseImageSrc;
  });
};

/**
 * Applies a mask destructively to an image data URL (typically the background layer).
 *
 * @param baseDataUrl The data URL of the image to modify.
 * @param maskDataUrl The data URL of the selection mask (white=selected, black=unselected).
 * @param dimensions The dimensions of the image.
 * @param operation 'delete' (clears selected area) or 'fill' (fills selected area with color).
 * @param fillColor The color to use if operation is 'fill'.
 * @returns A Promise resolving to the new image data URL.
 */
export const applyMaskDestructively = async (
  baseDataUrl: string,
  maskDataUrl: string,
  dimensions: Dimensions,
  operation: 'delete' | 'fill',
  fillColor: string = '#FFFFFF'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error("Failed to get canvas context."));

    const baseImg = new Image();
    baseImg.onload = () => {
      const maskImg = new Image();
      maskImg.onload = () => {
        // 1. Draw the original image
        ctx.drawImage(baseImg, 0, 0);

        // 2. Use the mask to define the area to modify
        
        // Create a temporary canvas for the mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = dimensions.width;
        maskCanvas.height = dimensions.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return reject(new Error("Failed to get mask canvas context."));
        
        maskCtx.drawImage(maskImg, 0, 0);
        
        // Use the mask as a clipping path or alpha source
        
        if (operation === 'delete') {
          // Use destination-out to clear the area defined by the mask
          ctx.globalCompositeOperation = 'destination-out';
          ctx.drawImage(maskImg, 0, 0);
        } else if (operation === 'fill') {
          // Draw the fill color, clipped by the mask
          
          // Draw the mask onto the main canvas using destination-in to isolate the selected area
          ctx.globalCompositeOperation = 'destination-in';
          ctx.drawImage(maskImg, 0, 0);
          
          // Now draw the fill color over the isolated area (source-over)
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = fillColor;
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        }

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
        
        resolve(canvas.toDataURL('image/png'));
      };
      maskImg.onerror = () => reject(new Error("Failed to load mask image."));
      maskImg.src = maskDataUrl;
    };
    baseImg.onerror = () => reject(new Error("Failed to load base image."));
    baseImg.src = baseDataUrl;
  });
};

/**
 * Initiates a download of the given base64 image data.
 */
export const downloadImage = (base64Image: string, filename: string, format: string, quality: number) => {
  const link = document.createElement('a');
  const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
  
  // For JPEG/WEBP, we need to re-encode with quality (stubbed here)
  let finalDataUrl = base64Image;
  if (format === 'jpeg' || format === 'jpg' || format === 'webp') {
    // In a real scenario, we'd use a library or canvas to re-encode with quality
    // For now, we just use the default PNG output and rename the extension.
    finalDataUrl = base64Image.replace('image/png', mimeType);
  }

  link.href = finalDataUrl;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copies the given base64 image data to the clipboard.
 */
export const copyImageToClipboard = (base64Image: string) => {
  // STUB: Clipboard API for images is complex and requires permissions.
  // We simulate success.
  console.log("Simulating copy image to clipboard:", base64Image.substring(0, 50) + "...");
  // In a real app, use navigator.clipboard.write([new ClipboardItem(...)])
};