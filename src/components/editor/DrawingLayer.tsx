"use client";

import * as React from "react";
import type { Layer } from "@/hooks/useEditorState";

interface DrawingLayerProps {
  layer: Layer;
}

export const DrawingLayer = ({ layer }: DrawingLayerProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !layer.dataUrl) return;

    const loadImage = async (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const renderLayer = async () => {
      try {
        const contentImage = await loadImage(layer.dataUrl!);
        
        canvas.width = contentImage.naturalWidth;
        canvas.height = contentImage.naturalHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply layer's blend mode and opacity
        ctx.globalAlpha = (layer.opacity ?? 100) / 100;
        ctx.globalCompositeOperation = (layer.blendMode || 'normal') as GlobalCompositeOperation;

        ctx.drawImage(contentImage, 0, 0);

        if (layer.maskDataUrl) {
          const maskImage = await loadImage(layer.maskDataUrl);
          ctx.globalCompositeOperation = 'destination-in'; // Use mask to clip content
          ctx.drawImage(maskImage, 0, 0);
        }
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to render drawing layer with mask:", error);
        setIsLoaded(false);
      }
    };

    renderLayer();
  }, [layer.dataUrl, layer.maskDataUrl, layer.opacity, layer.blendMode]);

  if (!layer.visible || layer.type !== "drawing" || !layer.dataUrl) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        // Opacity and blend mode are applied directly to the canvas context,
        // but we keep them here for consistency if the canvas itself needs styling.
        // However, for blendMode, it's usually better to apply to context.
        // opacity: (layer.opacity ?? 100) / 100,
        // mixBlendMode: layer.blendMode as any || 'normal',
        visibility: isLoaded ? 'visible' : 'hidden', // Hide until fully loaded and rendered
      }}
    />
  );
};