import { useCallback } from 'react';
import type { EditState, Dimensions, Layer } from '@/types/editor';
import { downloadImage, renderImageToCanvas } from '@/utils/imageUtils';
import { showLoading, dismissToast, showError, showSuccess } from '@/utils/toast';
import * as React from 'react';

interface ExportOptions {
  filename: string;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
}

export const useExport = ({ layers, dimensions, currentEditState, imgRef, base64Image, stabilityApiKey }: {
  layers: Layer[];
  dimensions: Dimensions | null;
  currentEditState: EditState;
  imgRef: React.RefObject<HTMLImageElement>;
  base64Image: string | null;
  stabilityApiKey: string;
}) => {
  
  const handleExportClick = useCallback((options: ExportOptions) => {
    if (!dimensions || !base64Image) {
      showError("No image or dimensions available for export.");
      return;
    }

    const toastId = showLoading(`Preparing export: ${options.filename}.${options.format}...`);

    try {
      // 1. Render the final image state to a canvas (using isExporting: true for full quality)
      const canvas = renderImageToCanvas(
        layers, 
        dimensions, 
        currentEditState, 
        imgRef.current, 
        false, 
        true // isExporting = true
      );

      // 2. Get the data URL based on format and quality
      let mimeType: string;
      let dataUrl: string;
      
      if (options.format === 'jpeg') {
        mimeType = 'image/jpeg';
        dataUrl = canvas.toDataURL(mimeType, options.quality / 100);
      } else if (options.format === 'webp') {
        mimeType = 'image/webp';
        dataUrl = canvas.toDataURL(mimeType, options.quality / 100);
      } else {
        mimeType = 'image/png';
        dataUrl = canvas.toDataURL(mimeType);
      }

      // 3. Trigger download
      const filename = `${options.filename}.${options.format}`;
      downloadImage(dataUrl, filename);
      
      dismissToast(toastId);
      showSuccess(`Image exported as ${filename}.`);

    } catch (error) {
      console.error("Export failed:", error);
      dismissToast(toastId);
      showError("Export failed. Check console for details.");
    }
  }, [layers, dimensions, currentEditState, imgRef, base64Image]);
  
  return { handleExportClick };
};