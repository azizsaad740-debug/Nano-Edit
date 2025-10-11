import type { Layer } from "@/hooks/useEditorState";

/**
 * Rasterizes a single layer (text, drawing, smart-object, vector-shape, or gradient) to a canvas.
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
      backgroundColor, padding = 0,
    } = layer;

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    // ctx.letterSpacing is not supported by Canvas API for rendering

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
  } else if (layer.type === 'vector-shape') { // New: Handle vector shapes
    const {
      x = 50, y = 50, width = 10, height = 10, rotation = 0,
      fillColor = 'none', strokeColor = 'none', strokeWidth = 0,
      borderRadius = 0, shapeType, points,
    } = layer;

    const shapeX = (x / 100) * imageDimensions.width;
    const shapeY = (y / 100) * imageDimensions.height;
    const shapeWidth = (width / 100) * imageDimensions.width;
    const shapeHeight = (height / 100) * imageDimensions.height;

    ctx.save();
    ctx.translate(shapeX, shapeY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-shapeWidth / 2, -shapeHeight / 2); // Adjust for center origin

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    switch (shapeType) {
      case 'rect':
        if (borderRadius && borderRadius > 0) {
          const radiusPx = Math.min(shapeWidth, shapeHeight) * (borderRadius / 100);
          ctx.roundRect(0, 0, shapeWidth, shapeHeight, radiusPx);
        } else {
          ctx.rect(0, 0, shapeWidth, shapeHeight);
        }
        break;
      case 'circle':
        ctx.arc(shapeWidth / 2, shapeHeight / 2, Math.min(shapeWidth, shapeHeight) / 2, 0, 2 * Math.PI);
        break;
      case 'triangle':
        if (points && points.length === 3) {
          // Points are defined relative to a 100x100 box, scale them
          ctx.moveTo((points[0].x / 100) * shapeWidth, (points[0].y / 100) * shapeHeight);
          ctx.lineTo((points[1].x / 100) * shapeWidth, (points[1].y / 100) * shapeHeight);
          ctx.lineTo((points[2].x / 100) * shapeWidth, (points[2].y / 100) * shapeHeight);
          ctx.closePath();
        } else {
          // Default equilateral triangle
          ctx.moveTo(shapeWidth / 2, 0);
          ctx.lineTo(shapeWidth, shapeHeight);
          ctx.lineTo(0, shapeHeight);
          ctx.closePath();
        }
        break;
      default:
        break;
    }

    if (fillColor !== 'none') ctx.fill();
    if (strokeWidth > 0 && strokeColor !== 'none') ctx.stroke();
    ctx.restore();

  } else if (layer.type === 'gradient') { // New: Handle gradient layers
    const {
      x = 50, y = 50, width = 100, height = 100, rotation = 0,
      gradientType = 'linear', gradientColors = ["#FFFFFF", "#000000"], gradientAngle = 90,
      gradientStops = [0, 1],
    } = layer;

    const layerX = (x / 100) * imageDimensions.width;
    const layerY = (y / 100) * imageDimensions.height;
    const layerWidth = (width / 100) * imageDimensions.width;
    const layerHeight = (height / 100) * imageDimensions.height;

    ctx.save();
    ctx.translate(layerX, layerY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-layerWidth / 2, -layerHeight / 2); // Adjust for center origin

    if (gradientType === 'linear') {
      const angleRad = gradientAngle * Math.PI / 180;
      const startX = layerWidth / 2 - Math.cos(angleRad) * layerWidth / 2;
      const startY = layerHeight / 2 - Math.sin(angleRad) * layerHeight / 2;
      const endX = layerWidth / 2 + Math.cos(angleRad) * layerWidth / 2;
      const endY = layerHeight / 2 + Math.sin(angleRad) * layerHeight / 2;

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradientColors.forEach((color, i) => {
        gradient.addColorStop(gradientStops[i] ?? (i / (gradientColors.length - 1)), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, layerWidth, layerHeight);
    } else if (gradientType === 'radial') {
      // Radial gradient implementation (coming soon)
      // For now, draw a placeholder
      ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
      ctx.fillRect(0, 0, layerWidth, layerHeight);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, layerWidth, layerHeight);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Radial (Coming Soon)', layerWidth / 2, layerHeight / 2);
    }
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
      
      // Apply smart object layer's own transforms (x, y, width, height, rotation)
      ctx.save();
      
      const layerX = (layer.x ?? 0) / 100 * imageDimensions.width;
      const layerY = (layer.y ?? 0) / 100 * imageDimensions.height;
      const layerWidth = (layer.width ?? 100) / 100 * imageDimensions.width;
      const layerHeight = (layer.height ?? 100) / 100 * imageDimensions.height;
      const layerRotation = layer.rotation ?? 0;

      // Translate to the center of the smart object for rotation
      ctx.translate(layerX + layerWidth / 2, layerY + layerHeight / 2);
      ctx.rotate(layerRotation * Math.PI / 180);
      // Translate back to draw the image
      ctx.drawImage(smartCanvas, -layerWidth / 2, -layerHeight / 2, layerWidth, layerHeight);
      
      ctx.restore();
    }
  } else if (layer.type === 'group' && layer.children) { // New: Handle group layers
    const groupCanvas = document.createElement('canvas');
    groupCanvas.width = imageDimensions.width;
    groupCanvas.height = imageDimensions.height;
    const groupCtx = groupCanvas.getContext('2d');

    if (groupCtx) {
      // Render children layers onto the group canvas
      for (const childLayer of layer.children) {
        if (!childLayer.visible) continue;

        const nestedLayerCanvas = await rasterizeLayerToCanvas(childLayer, imageDimensions);
        if (nestedLayerCanvas) {
          groupCtx.globalAlpha = (childLayer.opacity ?? 100) / 100;
          groupCtx.globalCompositeOperation = (childLayer.blendMode || 'normal') as GlobalCompositeOperation;
          
          // Apply child's position relative to the group's bounding box
          // This assumes child.x, child.y, child.width, child.height are relative to the group's dimensions
          // For now, we'll draw them directly onto the main canvas, assuming their (x,y) are already global
          // A more robust solution would involve drawing to a temporary canvas at group's size, then drawing that canvas
          // onto the main canvas with group's transforms.
          groupCtx.drawImage(nestedLayerCanvas, 0, 0);
        }
      }

      // Apply group layer's own transforms (x, y, width, height, rotation)
      ctx.save();
      
      const layerX = (layer.x ?? 0) / 100 * imageDimensions.width;
      const layerY = (layer.y ?? 0) / 100 * imageDimensions.height;
      const layerWidth = (layer.width ?? 100) / 100 * imageDimensions.width;
      const layerHeight = (layer.height ?? 100) / 100 * imageDimensions.height;
      const layerRotation = layer.rotation ?? 0;

      // Translate to the center of the group for rotation
      ctx.translate(layerX + layerWidth / 2, layerY + layerHeight / 2);
      ctx.rotate(layerRotation * Math.PI / 180);
      // Translate back to draw the image
      ctx.drawImage(groupCanvas, -layerWidth / 2, -layerHeight / 2, layerWidth, layerHeight);
      
      ctx.restore();
    }
  }

  return canvas;
};