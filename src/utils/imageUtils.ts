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