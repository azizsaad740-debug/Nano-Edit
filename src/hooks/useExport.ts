import { useCallback } from 'react';
import type { Layer, EditState, Dimensions } from '@/types/editor';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { renderImageToCanvas } from '@/utils/imageUtils';

interface UseExportProps {
    layers: Layer[];
    dimensions: Dimensions | null;
    currentEditState: EditState;
    imgRef: React.RefObject<HTMLImageElement>;
    base64Image: string | null;
    stabilityApiKey: string | null;
    fileInfo: { name: string; size: number } | null; // ADDED
}

export const useExport = ({ layers, dimensions, currentEditState, imgRef, base64Image, stabilityApiKey, fileInfo }: UseExportProps) => {
    
    const handleExportClick = useCallback(() => {
        // Stub implementation for export logic
        const toastId = showLoading("Preparing export...");
        
        if (!dimensions || !base64Image) {
            dismissToast(toastId);
            showError("Cannot export: Image dimensions or data missing.");
            return;
        }

        // Use fileInfo here (Fix TS2304)
        const fileName = fileInfo?.name.replace(/\.[^/.]+$/, "") || "exported_image";
        
        // Simulate rendering the final image
        const canvas = renderImageToCanvas(layers, dimensions, currentEditState, imgRef.current, false, true);
        const dataUrl = canvas.toDataURL('image/png');
        
        // Trigger download (stub)
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${fileName}.png`; // Use fileInfo here (Fix TS2304)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        dismissToast(toastId);
        showSuccess("Image exported successfully.");
    }, [layers, dimensions, currentEditState, imgRef, base64Image, stabilityApiKey, fileInfo]);

    return { handleExportClick };
};