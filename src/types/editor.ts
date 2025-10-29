// Add these utility functions/type guards to a suitable utility file or directly in the hooks/components if necessary, but for now, let's assume they are available or we use casting/narrowing directly in the files.

// Since Layer is a union type, we need type guards or casting to access specific properties.
// For example:
export function isVectorShapeLayer(layer: Layer): layer is VectorShapeLayerData {
  return layer.type === 'vector-shape';
}

export function isTextLayer(layer: Layer): layer is TextLayerData {
  return layer.type === 'text';
}

export function isDrawingLayer(layer: Layer): layer is DrawingLayerData {
  return layer.type === 'drawing';
}

export function isImageLayer(layer: Layer): layer is ImageLayerData {
  return layer.type === 'image';
}

export function isImageOrDrawingLayer(layer: Layer): layer is ImageLayerData | DrawingLayerData {
  return layer.type === 'image' || layer.type === 'drawing';
}