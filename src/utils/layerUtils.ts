import type { Layer, Dimensions, EditState, TextLayerData, VectorShapeLayerData, GradientLayerData } from '@/types/editor';
import { isImageOrDrawingLayer, isTextLayer, isVectorShapeLayer, isGradientLayer } from '@/types/editor';
import { showError, showSuccess } from '@/utils/toast';
import { upscaleImageApi } from './stabilityApi';

/**
 * Renders a list of layers onto a single canvas and returns the data URL.
 * This is used for Smart Object rasterization and export.
 */
export const rasterizeLayersToDataUrl = async (
  layers: Layer[], 
  dimensions: Dimensions, 
  editState: EditState,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return reject(new Error("Failed to get canvas context for rasterization."));

    // 1. Fill with transparent background
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.crossOrigin = "anonymous";
        img.src = src;
      });
    };

    const renderLayerContent = async (layer: Layer) => {
      ctx.save();
      
      // Apply global layer properties (opacity, blend mode)
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation || 'source-over';
      
      // Calculate layer bounds in pixels (relative to canvas 0,0)
      const layerWidthPx = dimensions.width * (layer.width / 100);
      const layerHeightPx = dimensions.height * (layer.height / 100);
      const layerX = dimensions.width * (layer.x / 100) - layerWidthPx / 2;
      const layerY = dimensions.height * (layer.y / 100) - layerHeightPx / 2;
      
      // Apply transform (translate to center, rotate, scale)
      ctx.translate(layerX + layerWidthPx / 2, layerY + layerHeightPx / 2);
      ctx.rotate((layer.rotation || 0) * Math.PI / 180);
      ctx.scale(layer.scaleX || 1, layer.scaleY || 1);
      ctx.translate(-(layerX + layerWidthPx / 2), -(layerY + layerHeightPx / 2));
      
      // --- Draw Content ---
      
      if (isImageOrDrawingLayer(layer) && layer.dataUrl) {
        try {
          const img = await loadImage(layer.dataUrl);
          ctx.drawImage(img, layerX, layerY, layerWidthPx, layerHeightPx);
        } catch (e) {
          console.warn(`Failed to draw image/drawing layer ${layer.id}`);
        }
      } else if (isTextLayer(layer)) {
        const textLayer = layer as TextLayerData;
        ctx.fillStyle = textLayer.color;
        ctx.font = `${textLayer.fontWeight || 'normal'} ${textLayer.fontStyle || 'normal'} ${textLayer.fontSize}px ${textLayer.fontFamily || 'sans-serif'}`;
        ctx.textAlign = textLayer.textAlign || 'center';
        
        const textX = layerX + layerWidthPx * (textLayer.textAlign === 'left' ? 0 : textLayer.textAlign === 'right' ? 1 : 0.5);
        const textY = layerY + layerHeightPx / 2 + textLayer.fontSize / 3; // Rough vertical centering
        
        // Simple multi-line text rendering stub
        textLayer.content.split('\n').forEach((line, index) => {
          ctx.fillText(line, textX, textY + index * textLayer.fontSize * (textLayer.lineHeight || 1.2));
        });
        
      } else if (isVectorShapeLayer(layer)) {
        const shapeLayer = layer as VectorShapeLayerData;
        
        ctx.fillStyle = shapeLayer.fillColor || 'none';
        ctx.strokeStyle = shapeLayer.strokeColor || 'none';
        ctx.lineWidth = shapeLayer.strokeWidth || 0;
        
        // Simplified shape drawing (only rect/circle/polygon stubbed)
        ctx.beginPath();
        if (shapeLayer.shapeType === 'rect') {
          ctx.rect(layerX, layerY, layerWidthPx, layerHeightPx);
        } else if (shapeLayer.shapeType === 'circle') {
          ctx.arc(layerX + layerWidthPx / 2, layerY + layerHeightPx / 2, Math.min(layerWidthPx, layerHeightPx) / 2, 0, 2 * Math.PI);
        } else if (shapeLayer.shapeType === 'polygon' && shapeLayer.points) {
          // Convert percentage points (0-100) to pixel coordinates within the layer bounds
          const pointsPx = shapeLayer.points.map(p => ({
            x: layerX + layerWidthPx * (p.x / 100),
            y: layerY + layerHeightPx * (p.y / 100),
          }));
          
          if (pointsPx.length > 0) {
            ctx.moveTo(pointsPx[0].x, pointsPx[0].y);
            pointsPx.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
          }
        }
        
        if (shapeLayer.fillColor && shapeLayer.fillColor !== 'none') ctx.fill();
        if (shapeLayer.strokeWidth > 0 && shapeLayer.strokeColor && shapeLayer.strokeColor !== 'none') ctx.stroke();
        
      } else if (isGradientLayer(layer)) {
        const gradientLayer = layer as GradientLayerData;
        
        // Simplified gradient drawing (linear only)
        const gradient = ctx.createLinearGradient(layerX, layerY, layerX + layerWidthPx, layerY + layerHeightPx);
        gradientLayer.gradientColors.forEach((color, i) => {
          gradient.addColorStop(gradientLayer.stops[i] ?? (i / (gradientLayer.gradientColors.length - 1)), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(layerX, layerY, layerWidthPx, layerHeightPx);
      }
      
      ctx.restore();
    };

    // Render layers in reverse order (bottom layer first)
    const renderPromises = layers.slice().reverse().filter(l => l.visible).map(renderLayerContent);

    Promise.all(renderPromises)
      .then(() => {
        resolve(canvas.toDataURL('image/png'));
      })
      .catch(reject);
  });
};

export const rasterizeLayerToCanvas = (layer: Layer, dimensions: Dimensions): HTMLCanvasElement => { // Fix 165, 166
    // Stub implementation
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    // ... drawing logic
    return canvas;
};

export const applyLayerTransform = (ctx: CanvasRenderingContext2D, layer: Layer, dimensions: Dimensions) => { // Fix 58
    // Stub implementation
};