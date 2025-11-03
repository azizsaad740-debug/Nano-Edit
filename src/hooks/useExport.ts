import { useCallback } from 'react';
import type { EditState, Dimensions, Layer } from '@/types/editor';
import { downloadImage, renderImageToCanvas } from '@/utils/imageUtils';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { upscaleImageApi } from '@/utils/stabilityApi';
import type { ExportOptionsType } from '@/components/editor/ExportOptions';

interface UseExportProps {
  layers: Layer[];
  dimensions: Dimensions | null;
  currentEditState: EditState;
  imgRef: React.RefObject<HTMLImageElement>;
  base64Image: string | null;
  stabilityApiKey: string;
}

export const useExport = ({ layers, dimensions, currentEditState, imgRef, base64Image, stabilityApiKey }: UseExportProps) => {
  
  const handleExportClick = useCallback(async (options: ExportOptionsType) => {
    if (!dimensions || !base64Image) {
      showError("Cannot export: No image loaded or dimensions missing.");
      return;
    }

    const { format, quality, width, height, upscale } = options;
    const isVector = format === "svg" || format === "pdf";
    const isLossy = format === "jpeg" || format === "jpg" || format === "webp";
    
    if (isVector) {
      showError(`Export to ${format.toUpperCase()} is currently a stub.`);
      return;
    }
    
    const toastId = showLoading(`Preparing export to ${format.toUpperCase()}...`);
    
    try {
      let finalDataUrl = base64Image;
      let finalWidth = dimensions.width;
      let finalHeight = dimensions.height;
      
      // 1. Render the current state to a base canvas (full quality)
      const renderedCanvas = renderImageToCanvas(
        layers, 
        dimensions, 
        currentEditState, 
        imgRef.current, 
        false, 
        true // isExporting = true
      );
      
      // Get the data URL from the rendered canvas (this includes all layers/filters applied destructively)
      let renderedDataUrl = renderedCanvas.toDataURL('image/png');
      
      // 2. Handle AI Upscaling
      if (upscale > 1) {
        dismissToast(toastId);
        const upscaleToastId = showLoading(`Upscaling image by ${upscale}x using Stability AI...`);
        
        const upscaledUrl = await upscaleImageApi(renderedDataUrl, stabilityApiKey, upscale as 2 | 4);
        
        dismissToast(upscaleToastId);
        showLoading(`Finalizing export to ${format.toUpperCase()}...`);
        
        finalDataUrl = upscaledUrl;
        finalWidth = dimensions.width * upscale;
        finalHeight = dimensions.height * upscale;
      } else {
        finalDataUrl = renderedDataUrl;
        finalWidth = dimensions.width;
        finalHeight = dimensions.height;
      }
      
      // 3. Handle Format Conversion and Resizing (if not upscaled)
      let outputDataUrl = finalDataUrl;
      let mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
      
      if (format !== 'png' || upscale > 1 || width !== finalWidth || height !== finalHeight || isLossy) {
        // Need a final canvas to handle resizing and format conversion
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const ctx = finalCanvas.getContext('2d');
        
        if (!ctx) throw new Error("Failed to create final canvas context.");
        
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = finalDataUrl;
        });
        
        // Draw the (potentially upscaled) image onto the final sized canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to target format
        const encoderOptions = isLossy ? quality : undefined;
        outputDataUrl = finalCanvas.toDataURL(mimeType, encoderOptions);
      }
      
      // 4. Trigger Download
      const fileName = `${fileInfo?.name.split('.')[0] || 'untitled'}_exported.${format}`;
      downloadImage(outputDataUrl, fileName);
      
      dismissToast(toastId);
      showSuccess(`Image exported successfully as ${format.toUpperCase()}.`);

    } catch (error) {
      dismissToast(toastId);
      console.error("Export failed:", error);
      showError(error.message || "Failed to export image.");
    }
  }, [dimensions, layers, currentEditState, imgRef, base64Image, stabilityApiKey, fileInfo]);
  
  return { handleExportClick };
};