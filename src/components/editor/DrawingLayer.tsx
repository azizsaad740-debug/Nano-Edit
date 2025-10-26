"use client";

import * as React from "react";
import type { Layer } from "@/types/editor";

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
        
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Ensure canvas is transparent
        
        // Apply layer's blend mode and opacity
        ctx.globalAlpha = (layer.opacity ?? 100) / 100;
        ctx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation; // Explicitly set to source-over or layer's blend mode

        ctx.drawImage(contentImage, 0, 0);

        // Reset composite operation before applying mask to ensure it's applied correctly
        ctx.globalCompositeOperation = 'source-over'; 

        if (layer.maskDataUrl) {
          const maskImage = await loadImage(layer.maskDataUrl);
          ctx.globalCompositeOperation = 'destination-in'; // Use mask to clip content
          ctx.drawImage(maskImage, 0, 0);
          ctx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation; // Reset to layer's blend mode after mask
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
        visibility: isLoaded ? 'visible' : 'hidden', // Hide until fully loaded and rendered
      }}
    />
  );
};