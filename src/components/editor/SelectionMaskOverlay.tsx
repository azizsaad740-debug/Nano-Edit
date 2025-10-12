"use client";

import * as React from "react";

interface SelectionMaskOverlayProps {
  maskDataUrl: string | null;
  imageNaturalDimensions: { width: number; height: number } | null;
  overlayColor?: string; // e.g., 'rgba(255, 0, 0, 0.5)'
}

export const SelectionMaskOverlay = ({
  maskDataUrl,
  imageNaturalDimensions,
  overlayColor = 'rgba(255, 0, 0, 0.5)',
}: SelectionMaskOverlayProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !imageNaturalDimensions) return;

    canvas.width = imageNaturalDimensions.width;
    canvas.height = imageNaturalDimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (maskDataUrl) {
      const maskImage = new Image();
      maskImage.onload = () => {
        // Draw the mask image
        ctx.drawImage(maskImage, 0, 0);

        // Apply the color overlay using source-atop composite operation
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = overlayColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over'; // Reset
      };
      maskImage.src = maskDataUrl;
    }
  }, [maskDataUrl, imageNaturalDimensions, overlayColor]);

  if (!maskDataUrl || !imageNaturalDimensions) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
};