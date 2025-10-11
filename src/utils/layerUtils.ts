import type { Layer } from "@/hooks/useEditorState";

/**
 * Rasterizes a single layer (text, drawing, or smart-object) to a canvas.
 * For smart-objects, it recursively renders its nested layers.
 * @param layer The layer to rasterize.
 * @param imageDimensions The target dimensions for the canvas (e.g., natural width/height of the main image).
 * @returns A Promise that resolves to an HTMLCanvasElement containing the rasterized layer, or null if an error occurs.
 */
export const rasterizeLayerToCanvas = async (layer: Layer, imageDimensions: { width: number; height: number }): Promise<HTMLCanvasElement | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = imageDimensions.width;
  canvas.height = imageDimensions.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.globalAlpha = (layer.opacity ?? 100) / 100;
  ctx.globalCompositeOperation = (layer.blendMode || 'normal') as GlobalCompositeOperation;

  if (layer.type === 'drawing' && layer.dataUrl) {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = layer.dataUrl!;
    });
    ctx.drawImage(img, 0, 0);
  } else if (layer.type === 'text') {
    const {
      content = '', x = 50, y = 50, fontSize = 48, color = '#000000',
      fontFamily = 'Roboto', fontWeight = 'normal', fontStyle = 'normal',
      textAlign = 'center', rotation = 0, textShadow, stroke,
      backgroundColor, padding = 0, letterSpacing = 0,
    } = layer;

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    // ctx.letterSpacing = `${letterSpacing}px`; // Removed: Not directly supported by Canvas API for rendering

    const posX = (x / 100) * imageDimensions.width;
    const posY = (y / 100) * imageDimensions.height;

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(rotation * Math.PI / 180);

    const metrics = ctx.measureText(content);
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      let bgX = -padding;
      if (textAlign === 'center') bgX = -metrics.width / 2 - padding;
      else if (textAlign === 'right') bgX = -metrics.width - padding;

      const bgY = -metrics.actualBoundingBoxAscent - padding;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = textHeight + padding * 2;
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      ctx.fillStyle = color;
    }

    if (textShadow) {
      ctx.shadowColor = textShadow.color;
      ctx.shadowBlur = textShadow.blur;
      ctx.shadowOffsetX = textShadow.offsetX;
      ctx.shadowOffsetY = textShadow.offsetY;
    }

    if (stroke && stroke.width > 0) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.strokeText(content, 0, 0);
    }
    ctx.fillText(content, 0, 0);
    ctx.restore();
  } else if (layer.type === 'smart-object' && layer.smartObjectData) {
    const smartCanvas = document.createElement('canvas');
    smartCanvas.width = layer.smartObjectData.width;
    smartCanvas.height = layer.smartObjectData.height;
    const smartCtx = smartCanvas.getContext('2d');

    if (smartCtx) {
      for (const smartLayer of layer.smartObjectData.layers) {
        if (!smartLayer.visible) continue;

        const nestedLayerCanvas = await rasterizeLayerToCanvas(smartLayer, { width: smartCanvas.width, height: smartCanvas.height });
        if (nestedLayerCanvas) {
          smartCtx.globalAlpha = (smartLayer.opacity ?? 100) / 100;
          smartCtx.globalCompositeOperation = (smartLayer.blendMode || 'normal') as GlobalCompositeOperation;
          smartCtx.drawImage(nestedLayerCanvas, 0, 0);
        }
      }
      // Draw the smart object's content onto the main canvas, scaled to fit
      ctx.drawImage(smartCanvas, 0, 0, imageDimensions.width, imageDimensions.height);
    }
  }

  return canvas;
};