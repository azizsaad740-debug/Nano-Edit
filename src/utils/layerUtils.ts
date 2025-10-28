import type { Layer } from "@/types/editor";

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

  // --- Helper to handle transformations ---
  const applyTransform = (layer: Layer, ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const x = layer.x ?? 50;
    const y = layer.y ?? 50;
    const rotation = layer.rotation ?? 0;

    // Translate to center of the layer's bounding box
    const centerX = (x / 100) * imageDimensions.width;
    const centerY = (y / 100) * imageDimensions.height;

    ctx.translate(centerX, centerY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-width / 2, -height / 2);
  };

  // --- Layer Content Rendering ---

  if (layer.type === 'drawing' && layer.dataUrl) {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = layer.dataUrl!;
    });
    
    // Drawing layers are assumed to be full canvas size (100% width/height)
    ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);

  } else if (layer.type === 'image' && layer.dataUrl) {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = layer.dataUrl!;
    });
    
    // Background image layer is drawn directly to fill the canvas
    ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);

  } else if (layer.type === 'text') {
    const { content, fontSize, color, fontFamily, fontWeight, fontStyle, textAlign, letterSpacing, lineHeight, textShadow, stroke, backgroundColor, padding } = layer;
    if (!content) return canvas;

    // Text rendering is complex due to dynamic sizing. We need to estimate the bounding box first.
    // For simplicity in rasterization, we'll draw the text directly onto the canvas, 
    // using the layer's x/y/rotation properties.

    ctx.save();
    
    const textFontSize = fontSize ?? 48;
    const textFontFamily = fontFamily ?? 'Roboto';
    const textFontWeight = fontWeight ?? 'normal';
    const textFontStyle = fontStyle ?? 'normal';
    const textLineHeight = lineHeight ?? 1.2;
    const textPadding = padding ?? 0;
    
    ctx.font = `${textFontWeight} ${textFontStyle} ${textFontSize}px ${textFontFamily}`;
    ctx.fillStyle = color ?? '#000000';
    ctx.textAlign = (textAlign === 'justify' ? 'left' : textAlign) as CanvasTextAlign ?? 'center'; // Fix TS2322
    ctx.textBaseline = 'middle';
    
    // Calculate text metrics for positioning
    const lines = content.split('\n');
    const lineHeightPx = textFontSize * textLineHeight;
    const totalHeight = lines.length * lineHeightPx;
    
    // Find max width for background calculation
    let maxWidth = 0;
    lines.forEach(line => {
      maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
    });
    
    const textWidth = maxWidth;
    const textHeight = totalHeight;
    
    // Apply transformation based on layer properties
    applyTransform(layer, ctx, textWidth + textPadding * 2, textHeight + textPadding * 2);
    
    // Adjust for text alignment offset (since applyTransform assumes center origin)
    let offsetX = 0;
    if (textAlign === 'left') offsetX = textWidth / 2;
    if (textAlign === 'right') offsetX = -textWidth / 2;
    
    // Draw background if present
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        -textWidth / 2 - textPadding + offsetX, 
        -totalHeight / 2 - textPadding, 
        textWidth + textPadding * 2, 
        totalHeight + textPadding * 2
      );
    }

    // Apply text shadow if present
    if (textShadow) {
      ctx.shadowColor = textShadow.color;
      ctx.shadowBlur = textShadow.blur;
      ctx.shadowOffsetX = textShadow.offsetX;
      ctx.shadowOffsetY = textShadow.offsetY;
    }
    
    // Apply stroke if present (requires non-standard canvas properties, often simulated)
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * 2; // Stroke width is usually doubled for outline effect
      ctx.lineJoin = 'round';
    }

    // Draw text line by line
    lines.forEach((line, index) => {
      const lineY = -totalHeight / 2 + index * lineHeightPx + lineHeightPx / 2;
      
      // Draw stroke first
      if (stroke) {
        ctx.strokeText(line, offsetX, lineY);
      }
      
      // Draw fill
      ctx.fillStyle = color ?? '#000000';
      ctx.fillText(line, offsetX, lineY);
    });

    ctx.restore();

  } else if (layer.type === 'vector-shape') {
    const { x, y, width, height, rotation, fillColor, strokeColor, strokeWidth, borderRadius, shapeType, points, starPoints, lineThickness } = layer;
    
    const layerWidth = (width ?? 10) / 100 * imageDimensions.width;
    const layerHeight = (height ?? 10) / 100 * imageDimensions.height;

    ctx.save();
    applyTransform(layer, ctx, layerWidth, layerHeight);
    
    ctx.beginPath();
    
    // Set fill and stroke styles
    ctx.fillStyle = fillColor || 'transparent';
    ctx.strokeStyle = strokeColor || 'transparent';
    
    // Determine line width based on shape type
    const isLineShape = shapeType === 'line' || shapeType === 'arrow';
    ctx.lineWidth = isLineShape ? (lineThickness || strokeWidth || 5) : (strokeWidth || 0);
    ctx.lineCap = isLineShape ? 'round' : 'butt';

    // Draw shape relative to the transformed origin (which is the top-left corner of the bounding box)
    if (shapeType === 'rect') {
      const radius = (borderRadius ?? 0) / 100 * Math.min(layerWidth, layerHeight) / 2;
      if (radius > 0) {
        // Draw rounded rectangle
        ctx.moveTo(radius, 0);
        ctx.lineTo(layerWidth - radius, 0);
        ctx.arcTo(layerWidth, 0, layerWidth, radius, radius);
        ctx.lineTo(layerWidth, layerHeight - radius);
        ctx.arcTo(layerWidth, layerHeight, layerWidth - radius, layerHeight, radius);
        ctx.lineTo(radius, layerHeight);
        ctx.arcTo(0, layerHeight, 0, layerHeight - radius, radius);
        ctx.lineTo(0, radius);
        ctx.arcTo(0, 0, radius, 0, radius);
      } else {
        ctx.rect(0, 0, layerWidth, layerHeight);
      }
    } else if (shapeType === 'circle') {
      const radius = Math.min(layerWidth, layerHeight) / 2;
      ctx.arc(layerWidth / 2, layerHeight / 2, radius, 0, 2 * Math.PI);
    } else if (shapeType === 'triangle' || shapeType === 'polygon' || shapeType === 'custom') {
      const polygonPoints = points || [];
      if (polygonPoints.length > 1) {
        // Points are stored as percentages (0-100) relative to the layer's bounding box
        ctx.moveTo((polygonPoints[0].x / 100) * layerWidth, (polygonPoints[0].y / 100) * layerHeight);
        for (let i = 1; i < polygonPoints.length; i++) {
          ctx.lineTo((polygonPoints[i].x / 100) * layerWidth, (polygonPoints[i].y / 100) * layerHeight);
        }
        ctx.closePath();
      }
    } else if (shapeType === 'star') {
        const numPoints = starPoints || 5;
        const outerRadius = Math.min(layerWidth, layerHeight) / 2;
        const innerRadius = outerRadius / 2.5;
        const centerX = layerWidth / 2;
        const centerY = layerHeight / 2;

        for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / numPoints) * i - Math.PI / 2; // Start pointing up
            const px = centerX + radius * Math.cos(angle);
            const py = centerY + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
    } else if (isLineShape) {
        // Line runs from (0, layerHeight/2) to (layerWidth, layerHeight/2)
        const lineW = lineThickness || strokeWidth || 5;
        const startX = 0;
        const startY = layerHeight / 2;
        const endX = layerWidth;
        const endY = layerHeight / 2;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        if (shapeType === 'arrow') {
            // Draw arrowhead at the end point (endX, endY)
            const headLength = lineW * 3;
            const headWidth = lineW * 2;
            
            // Draw the arrowhead path separately (as part of the same path for stroke)
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLength, endY - headWidth / 2);
            ctx.lineTo(endX - headLength, endY + headWidth / 2);
            ctx.closePath();
        }
    }
    
    if (fillColor && fillColor !== 'none') ctx.fill();
    // Stroke if stroke is defined and width > 0
    if (ctx.lineWidth > 0 && strokeColor && strokeColor !== 'none') {
        ctx.stroke();
    }

    ctx.restore();

  } else if (layer.type === 'gradient') {
    const { x, y, width, height, rotation, gradientType, gradientColors, gradientStops, gradientAngle, gradientFeather, gradientInverted, gradientCenterX, gradientCenterY, gradientRadius } = layer;
    
    const layerWidth = (width ?? 100) / 100 * imageDimensions.width;
    const layerHeight = (height ?? 100) / 100 * imageDimensions.height;

    ctx.save();
    applyTransform(layer, ctx, layerWidth, layerHeight);
    
    // Gradient drawing happens relative to the layer's bounding box (0, 0 to layerWidth, layerHeight)
    
    let colors = [...(gradientColors || ["#FFFFFF", "#000000"])];
    let stops = [...(gradientStops || [0, 1])];

    if (gradientInverted) {
      colors = colors.reverse();
      stops = stops.map(s => 1 - s).reverse();
    }

    let gradient;
    
    if (gradientType === 'linear') {
      // Linear gradient based on angle (0deg is top-to-bottom, 90deg is left-to-right)
      const angleRad = (gradientAngle ?? 90) * Math.PI / 180;
      
      // Calculate start and end points based on angle and bounding box
      const length = Math.abs(layerWidth * Math.sin(angleRad)) + Math.abs(layerHeight * Math.cos(angleRad));
      const startX = layerWidth / 2 - Math.sin(angleRad) * length / 2;
      const startY = layerHeight / 2 + Math.cos(angleRad) * length / 2;
      const endX = layerWidth / 2 + Math.sin(angleRad) * length / 2;
      const endY = layerHeight / 2 - Math.cos(angleRad) * length / 2;
      
      gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    } else if (gradientType === 'radial') {
      const centerX = (gradientCenterX ?? 50) / 100 * layerWidth;
      const centerY = (gradientCenterY ?? 50) / 100 * layerHeight;
      const radius = (gradientRadius ?? 50) / 100 * Math.min(layerWidth, layerHeight);
      
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }
    
    if (gradient) {
      colors.forEach((color, i) => {
        gradient.addColorStop(stops[i] ?? (i / (colors.length - 1)), color);
      });
      ctx.fillStyle = gradient;
      
      // Apply feathering (blur) to the gradient before drawing
      if (gradientFeather && gradientFeather > 0) {
        ctx.filter = `blur(${gradientFeather * 0.5}px)`;
      }
      
      ctx.fillRect(0, 0, layerWidth, layerHeight);
      ctx.filter = 'none'; // Reset filter
    }

    ctx.restore();

  } else if (layer.type === 'smart-object' && layer.smartObjectData) {
    // Recursively render smart object layers onto a temporary canvas
    const { layers: nestedLayers, width: soWidth, height: soHeight } = layer.smartObjectData;
    
    const soCanvas = document.createElement('canvas');
    soCanvas.width = soWidth;
    soCanvas.height = soHeight;
    const soCtx = soCanvas.getContext('2d');
    if (!soCtx) return canvas;

    // Render nested layers onto the smart object canvas
    for (const nestedLayer of nestedLayers) {
      const nestedLayerCanvas = await rasterizeLayerToCanvas(nestedLayer, { width: soWidth, height: soHeight });
      if (nestedLayerCanvas) {
        // Smart object layers are drawn directly onto the SO canvas without external transforms
        soCtx.globalAlpha = (nestedLayer.opacity ?? 100) / 100;
        soCtx.globalCompositeOperation = (nestedLayer.blendMode || 'source-over') as GlobalCompositeOperation;
        soCtx.drawImage(nestedLayerCanvas, 0, 0);
      }
    }
    
    // Draw the resulting smart object canvas onto the main canvas
    const layerWidth = (layer.width ?? 100) / 100 * imageDimensions.width;
    const layerHeight = (layer.height ?? 100) / 100 * imageDimensions.height;

    ctx.save();
    applyTransform(layer, ctx, layerWidth, layerHeight);
    ctx.drawImage(soCanvas, 0, 0, layerWidth, layerHeight);
    ctx.restore();
  }
  
  // Group layers and adjustment layers return the base canvas (they are handled in imageUtils)
  if (layer.type === 'group' || layer.type === 'adjustment') {
    return canvas;
  }

  // --- Apply Layer Mask ---
  if (layer.maskDataUrl) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = imageDimensions.width;
    maskCanvas.height = imageDimensions.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return canvas; // Return unmasked if mask context fails

    // 1. Draw the layer content onto the mask canvas
    maskCtx.drawImage(canvas, 0, 0);

    // 2. Load the mask image
    const maskImg = new Image();
    await new Promise((resolve, reject) => {
      maskImg.onload = resolve;
      maskImg.onerror = reject;
      maskImg.src = layer.maskDataUrl!;
    });

    // 3. Use the mask image to clip the layer content
    maskCtx.globalCompositeOperation = 'destination-in';
    maskCtx.drawImage(maskImg, 0, 0, imageDimensions.width, imageDimensions.height);

    return maskCanvas;
  }

  return canvas;
};