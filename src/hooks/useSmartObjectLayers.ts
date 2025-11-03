import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Layer, TextLayerData, DrawingLayerData, VectorShapeLayerData, GradientLayerData } from '@/types/editor';

export const useSmartObjectLayers = () => {
  // This hook is currently unused as Smart Object logic is consolidated in useLayers.
  // The following code snippets were likely intended for use within a layer creation function.
  
  const createTextLayerStub = () => {
    const newLayer: TextLayerData = {
      id: uuidv4(),
      name: 'Text Layer',
      type: 'text',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isLocked: false,
      maskDataUrl: null,
      x: 50, y: 50, width: 50, height: 10, rotation: 0, scaleX: 1, scaleY: 1,
      content: 'New Text',
      fontSize: 48,
      color: '#000000',
      fontFamily: 'Roboto',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      padding: 0,
    };
    return newLayer;
  };

  const createDrawingLayerStub = () => {
    const newLayer: DrawingLayerData = {
      id: uuidv4(),
      name: 'Drawing Layer',
      type: 'drawing',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isLocked: false,
      maskDataUrl: null,
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 transparent pixel
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
    };
    return newLayer;
  };

  const createVectorShapeLayerStub = () => {
    const newLayer: VectorShapeLayerData = {
      id: uuidv4(),
      name: 'Shape Layer',
      type: 'vector-shape',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isLocked: false,
      maskDataUrl: null,
      x: 50, y: 50, width: 10, height: 10, rotation: 0, scaleX: 1, scaleY: 1,
      shapeType: 'rect',
      fillColor: '#000000',
      strokeColor: '#FFFFFF',
      strokeWidth: 0,
      borderRadius: 0,
      strokeDasharray: undefined,
      strokeLinecap: 'butt',
      strokeLinejoin: 'miter',
    };
    return newLayer;
  };

  const createGradientLayerStub = () => {
    const newLayer: GradientLayerData = {
      id: uuidv4(),
      name: 'Gradient Layer',
      type: 'gradient',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isLocked: false,
      maskDataUrl: null,
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
      gradientType: 'linear',
      gradientColors: ['#000000', '#FFFFFF'],
      stops: [0, 1], // FIXED: Using 'stops'
      gradientAngle: 90,
      gradientFeather: 0,
      gradientInverted: false,
      gradientCenterX: 50,
      gradientCenterY: 50,
      gradientRadius: 50,
      startPoint: { x: 0, y: 50 },
      endPoint: { x: 100, y: 50 },
    };
    return newLayer;
  };

  return {
    createTextLayerStub,
    createDrawingLayerStub,
    createVectorShapeLayerStub,
    createGradientLayerStub,
  };
};