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
  ctx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation; // Explicitly set to source-over or layer's blend mode

  if (layer.type === 'drawing' && layer.dataUrl) {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = layer.dataUrl!;
    });
    ctx.drawImage(img, 0, 0);

    // Reset composite operation before applying mask to ensure it's applied correctly
    ctx.globalCompositeOperation = 'source-over'; 

    // Apply mask if present
    if (layer.maskDataUrl) {
      const maskImg = new Image();
      await new Promise((res, rej) => {
        maskImg.onload = res;
        maskImg.onerror = rej;
        maskImg.src = layer.maskDataUrl!;
      });
      ctx.globalCompositeOperation = 'destination-in'; // Use mask to clip content
      ctx.drawImage(maskImg, 0, 0);
      ctx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation; // Reset to layer's blend mode
    }
  } else if (layer.type === 'text') {
    const {
      content = '', x = 50, y = 50, fontSize = 48, color = '#000000',
      fontFamily = 'Roboto', fontWeight = 'normal', fontStyle = 'normal',
      textAlign = 'center', rotation = 0, textShadow, stroke,
      backgroundColor, padding = 0, lineHeight = 1.2, // Use lineHeight
    } = layer;

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    // ctx.letterSpacing is not supported by Canvas API for rendering

    const lines = content.split('\n');
    const lineSpacing = fontSize * lineHeight;
    const totalTextHeight = lines.length * lineSpacing;
    
    const posX = (x / 100) * imageDimensions.width;
    const posY = (y / 100) * imageDimensions.height;

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(rotation * Math.PI / 180);

    // Calculate text block metrics (approximation)
    const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const textAscent = fontSize * 0.8; // Approximation for ascent
    
    // Adjust vertical start position to center the entire block around posY
    const startY = -totalTextHeight / 2 + textAscent; 

    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      let bgX = -padding;
      if (textAlign === 'center') bgX = -textWidth / 2 - padding;
      else if (textAlign === 'right') bgX = -textWidth - padding;

      const bgY = -totalTextHeight / 2 - padding;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = totalTextHeight + padding * 2;
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      ctx.fillStyle = color;
    }

    if (textShadow) {
      ctx.shadowColor = textShadow.color;
      ctx.shadowBlur = textShadow.blur;
      ctx.shadowOffsetX = textShadow.offsetX;
      ctx.shadowOffsetY = textShadow.offsetY;
    }

    lines.forEach((line, index) => {
      const currentY = startY + index * lineSpacing;
      
      if (stroke && stroke.width > 0) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.strokeText(line, 0, currentY);
      }
      ctx.fillText(line, 0, currentY);
    });
    
    ctx.restore();
  } else if (layer.type === 'vector-shape') {
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

  } else if (layer.type === 'gradient') {
    const {
      x = 50, y = 50, width = 100, height = 100, rotation = 0,
      gradientType = 'linear', gradientColors = ["#FFFFFF", "#000000"], gradientAngle = 90,
      gradientStops = [0, 1], gradientInverted = false, gradientFeather = 0,
      gradientCenterX = 50, gradientCenterY = 50, gradientRadius = 50,
    } = layer;

    const layerX = (x / 100) * imageDimensions.width;
    const layerY = (y / 100) * imageDimensions.height;
    const layerWidth = (width / 100) * imageDimensions.width;
    const layerHeight = (height / 100) * imageDimensions.height;

    ctx.save();
    ctx.translate(layerX, layerY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-layerWidth / 2, -layerHeight / 2); // Adjust for center origin

    const tempGradientCanvas = document.createElement('canvas');
    tempGradientCanvas.width = layerWidth;
    tempGradientCanvas.height = layerHeight;
    const tempGradientCtx = tempGradientCanvas.getContext('2d');

    if (tempGradientCtx) {
      let colors = [...gradientColors];
      let stops = [...gradientStops];

      if (gradientInverted) {
        colors = colors.reverse();
        stops = stops.map(s => 1 - s).reverse();
      }

      if (gradientType === 'linear') {
        const angleRad = gradientAngle * Math.PI / 180;
        const startX = layerWidth / 2 - Math.cos(angleRad) * layerWidth / 2;
        const startY = layerHeight / 2 - Math.sin(angleRad) * layerHeight / 2;
        const endX = layerWidth / 2 + Math.cos(angleRad) * layerWidth / 2;
        const endY = layerHeight / 2 + Math.sin(angleRad) * layerHeight / 2;

        const gradient = tempGradientCtx.createLinearGradient(startX, startY, endX, endY);
        colors.forEach((color, i) => {
          gradient.addColorStop(stops[i] ?? (i / (colors.length - 1)), color);
        });
        tempGradientCtx.fillStyle = gradient;
        tempGradientCtx.fillRect(0, 0, layerWidth, layerHeight);
      } else if (gradientType === 'radial') {
        const centerX_px = (gradientCenterX / 100) * layerWidth;
        const centerY_px = (gradientCenterY / 100) * layerHeight;
        const radius_px = (gradientRadius / 100) * Math.min(layerWidth, layerHeight) / 2;

        const gradient = tempGradientCtx.createRadialGradient(centerX_px, centerY_px, 0, centerX_px, centerY_px, radius_px);
        colors.forEach((color, i) => {
          gradient.addColorStop(stops[i] ?? (i / (colors.length - 1)), color);
        });
        tempGradientCtx.fillStyle = gradient;
        tempGradientCtx.fillRect(0, 0, layerWidth, layerHeight);
      }

      if (gradientFeather > 0) {
        tempGradientCtx.filter = `blur(${gradientFeather * 0.5}px)`;
        tempGradientCtx.drawImage(tempGradientCanvas, 0, 0);
      }

      ctx.drawImage(tempGradientCanvas, 0, 0);
    }
    ctx.restore();

  } else if (layer.type === 'smart-object' && layer.smartObjectData) {
    const smartCanvas = document.createElement('canvas');
    smartCanvas.width = layer.smartObjectData.width;
    smartCanvas.height = layer.smartObjectData.height;
    const smartCtx = smartCanvas.getContext('2d');

    if (smartCtx) {
      // Render nested layers in reverse order (bottom layer in array first)
      const reversedNestedLayers = layer.smartObjectData.layers.slice().reverse();
      
      for (const smartLayer of reversedNestedLayers) {
        if (!smartLayer.visible) continue;

        const nestedLayerCanvas = await rasterizeLayerToCanvas(smartLayer, { width: smartCanvas.width, height: smartCanvas.height });
        if (nestedLayerCanvas) {
          smartCtx.globalAlpha = (smartLayer.opacity ?? 100) / 100;
          smartCtx.globalCompositeOperation = (smartLayer.blendMode || 'source-over') as GlobalCompositeOperation;
          
          // Clipping mask logic for nested layers
          const clippedLayer = reversedNestedLayers.find(l => l.id === smartLayer.id);
          const baseLayerIndex = reversedNestedLayers.findIndex(l => l.id === smartLayer.id) + 1;
          const baseLayer = reversedNestedLayers[baseLayerIndex];

          if (clippedLayer && clippedLayer.isClippingMask && baseLayer) {
            const baseLayerCanvas = await rasterizeLayerToCanvas(baseLayer, { width: smartCanvas.width, height: smartCanvas.height });
            if (baseLayerCanvas) {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = smartCanvas.width;
              tempCanvas.height = smartCanvas.height;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.drawImage(nestedLayerCanvas, 0, 0);
                tempCtx.globalCompositeOperation = 'destination-in';
                tempCtx.drawImage(baseLayerCanvas, 0, 0);
                smartCtx.drawImage(tempCanvas, 0, 0);
              }
            }
          } else {
            smartCtx.drawImage(nestedLayerCanvas, 0, 0);
          }
        }
      }
      
      ctx.save();
      
      const layerX = (layer.x ?? 50) / 100 * imageDimensions.width;
      const layerY = (layer.y ?? 50) / 100 * imageDimensions.height;
      const layerWidth = (layer.width ?? 100) / 100 * imageDimensions.width;
      const layerHeight = (layer.height ?? 100) / 100 * imageDimensions.height;
      const layerRotation = layer.rotation ?? 0;

      ctx.translate(layerX, layerY);
      ctx.rotate(layerRotation * Math.PI / 180);
      ctx.drawImage(smartCanvas, -layerWidth / 2, -layerHeight / 2, layerWidth, layerHeight);
      
      ctx.restore();
    }
  } else if (layer.type === 'group' && layer.children) {
    const groupCanvas = document.createElement('canvas');
    groupCanvas.width = imageDimensions.width;
    groupCanvas.height = imageDimensions.height;
    const groupCtx = groupCanvas.getContext('2d');

    if (groupCtx) {
      // Render children in reverse order (bottom layer in array first)
      const reversedChildren = layer.children.slice().reverse();
      
      for (const childLayer of reversedChildren) {
        if (!childLayer.visible) continue;

        const nestedLayerCanvas = await rasterizeLayerToCanvas(childLayer, imageDimensions);
        if (nestedLayerCanvas) {
          groupCtx.globalAlpha = (childLayer.opacity ?? 100) / 100;
          groupCtx.globalCompositeOperation = (childLayer.blendMode || 'source-over') as GlobalCompositeOperation;
          
          // Clipping mask logic for nested layers
          const clippedLayer = reversedChildren.find(l => l.id === childLayer.id);
          const baseLayerIndex = reversedChildren.findIndex(l => l.id === childLayer.id) + 1;
          const baseLayer = reversedChildren[baseLayerIndex];

          if (clippedLayer && clippedLayer.isClippingMask && baseLayer) {
            const baseLayerCanvas = await rasterizeLayerToCanvas(baseLayer, imageDimensions);
            if (baseLayerCanvas) {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = imageDimensions.width;
              tempCanvas.height = imageDimensions.height;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.drawImage(nestedLayerCanvas, 0, 0);
                tempCtx.globalCompositeOperation = 'destination-in';
                tempCtx.drawImage(baseLayerCanvas, 0, 0);
                groupCtx.drawImage(tempCanvas, 0, 0);
              }
            }
          } else {
            groupCtx.drawImage(nestedLayerCanvas, 0, 0);
          }
        }
      }

      ctx.save();
      
      const layerX = (layer.x ?? 50) / 100 * imageDimensions.width;
      const layerY = (layer.y ?? 50) / 100 * imageDimensions.height;
      const layerWidth = (layer.width ?? 100) / 100 * imageDimensions.width;
      const layerHeight = (layer.height ?? 100) / 100 * imageDimensions.height;
      const layerRotation = layer.rotation ?? 0;

      ctx.translate(layerX, layerY);
      ctx.rotate(layerRotation * Math.PI / 180);
      ctx.drawImage(groupCanvas, -layerWidth / 2, -layerHeight / 2, layerWidth, layerHeight);
      
      ctx.restore();
    }
  }

  return canvas;
};