// src/types/editor/layers.ts
import type { Point, ShapeType } from './core'; // REVERT
import type { AdjustmentState, CurvesState, HslAdjustmentsState, GradingState } from './adjustments'; // REVERT

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

// Base layer properties that all layers share
export interface BaseLayerData {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  isLocked: boolean;
  maskDataUrl?: string;
  isClippingMask?: boolean;
}

export interface ImageLayerData extends BaseLayerData {
  type: 'image';
  dataUrl: string;
}

export interface DrawingLayerData extends BaseLayerData {
  type: 'drawing';
  dataUrl: string;
}

export interface TextLayerData extends BaseLayerData {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | 'normal' | 'bold' | string;
  fontStyle: 'normal' | 'italic';
  color: string;
  fillColor?: string;
  stroke?: { width: number; color: string }; // Text stroke
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  backgroundColor?: string;
  padding?: number;
  textShadow?: { offsetX: number; offsetY: number; blur: number; color: string };
}

export interface VectorShapeLayerData extends BaseLayerData {
  type: 'vector-shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius?: number;
  points?: Point[];
  starPoints?: number;
  lineThickness?: number;
  strokeDasharray?: string; // NEW: e.g., "10 5"
  strokeLinecap?: 'butt' | 'round' | 'square'; // NEW
  strokeLinejoin?: 'miter' | 'round' | 'bevel'; // NEW
}

export interface GradientLayerData extends BaseLayerData {
  type: 'gradient';
  gradientType: 'linear' | 'radial'; // FIXED: Removed 'angle' | 'reflected' | 'diamond'
  gradientColors: string[];
  stops: number[]; // FIXED: Renamed from gradientStops to stops
  gradientAngle: number;
  gradientFeather: number;
  gradientInverted: boolean;
  gradientCenterX: number;
  gradientCenterY: number;
  gradientRadius: number;
}

export interface AdjustmentLayerData extends BaseLayerData {
  type: 'adjustment';
  adjustmentData: {
    type: 'brightness' | 'curves' | 'hsl' | 'grading';
    adjustments?: AdjustmentState;
    curves?: CurvesState;
    hslAdjustments?: HslAdjustmentsState;
    grading?: GradingState;
  };
}

export interface SmartObjectData {
  layers: Layer[];
  width: number;
  height: number;
}

export interface SmartObjectLayerData extends BaseLayerData {
  type: 'smart-object';
  smartObjectData: SmartObjectData;
}

export interface GroupLayerData extends BaseLayerData {
  type: 'group';
  children: Layer[];
  expanded: boolean;
}

export type Layer =
  | ImageLayerData
  | DrawingLayerData
  | TextLayerData
  | VectorShapeLayerData
  | GradientLayerData
  | AdjustmentLayerData
  | SmartObjectLayerData
  | GroupLayerData;

// --- Type Guards ---

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