import { useCallback } from 'react';
import type { EditState } from '@/types/editor';
import { downloadImage } from '@/utils/imageUtils';

export const useExport = (
  imgRef: React.RefObject<HTMLImageElement>,
  layers: any[],
  currentEditState: EditState,
  stabilityApiKey: string,
  dimensions: { width: number; height: number } | null,
  fileInfo: { name: string; size: number } | null,
) => {
  const handleExport = useCallback((options: {
    format: string;
    quality: number;
    width: number;
    height: number;
    upscale: 1 | 2 | 4;
  }) => {
    if (!imgRef.current || !dimensions) return;

    downloadImage(
      { image: imgRef.current, layers, ...currentEditState },
      options,
      stabilityApiKey
    );
  }, [imgRef, layers, currentEditState, stabilityApiKey, dimensions]);

  return { handleExport };
};