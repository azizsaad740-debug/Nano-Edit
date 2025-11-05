// src/types/editor/core.ts

import type { Icon } from "lucide-react"; // FIX 1: Change import to type Icon
import type { AdjustmentState, CurvesState, GradingState, HslAdjustmentsState, FrameState, EffectState, TransformState } from "./adjustments";
import type { BrushState as BrushStateTool, GradientToolState as GradientToolStateTool, SelectionSettings as SelectionSettingsTool } from "./tools";

// --- Core Types ---

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
export type ActiveTool = 'move' | 'crop' | 'brush' | 'eraser' | 'pencil' | 'cloneStamp' | 'patternStamp' | 'historyBrush' | 'artHistoryBrush' | 'selectionBrush' | 'blurBrush' | 'sharpenTool' | 'text' | 'shape' | 'gradient' | 'marqueeRect' | 'marqueeEllipse' | 'lassoFree' | 'lassoPoly' | 'magicWand' | 'objectSelect' | 'eyedropper' | 'hand' | 'zoom' | 'lasso' | 'quickSelect' | 'paintBucket' | 'lassoMagnetic';
export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'line' | 'circle' | 'arrow' | 'custom';
export type HslColorKey = 'master' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// --- Adjustment/State Interfaces (Re-exported from adjustments.ts for convenience) ---

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'px' | '%';
  aspect: number | null;
}

export interface HslAdjustment {
  hue: number;
  saturation: number;
  lightness: number; // Standardized property name
}

// Exporting the imported types to make them available via '@/types/editor'
export type { AdjustmentState, CurvesState, GradingState, HslAdjustmentsState, FrameState, EffectState, TransformState };

// --- Layer Data Interfaces ---

export interface BaseLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  isLocked: boolean;
  maskDataUrl: string | null;
  isClippingMask?: boolean;
  // Transform properties (relative to canvas size 0-100)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface ImageLayerData extends BaseLayer {
  type: 'image';
  dataUrl: string;
  exifData: any;
}

export interface DrawingLayerData extends BaseLayer {
  type: 'drawing';
  dataUrl: string;
}

export interface TextLayerData extends BaseLayer {
  type: 'text';
  content: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string | number; // Allow number for font weight
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number;
  lineHeight: number;
  padding: number;
  textShadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
  stroke?: { color: string; width: number } | null;
  backgroundColor?: string | null;
}

export interface VectorShapeLayerData extends BaseLayer {
  type: 'vector-shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  points?: Point[]; // For polygon/star
  starPoints?: number;
  lineThickness?: number;
  strokeDasharray?: string; // NEW: e.g., "10 5"
  strokeLinecap?: 'butt' | 'round' | 'square'; // NEW
  strokeLinejoin?: 'miter' | 'round' | 'bevel'; // NEW
}

export interface GradientLayerData extends BaseLayer {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  gradientColors: string[];
  stops: number[];
  gradientAngle: number;
  gradientFeather: number;
  gradientInverted: boolean;
  gradientCenterX: number;
  gradientCenterY: number;
  gradientRadius: number;
  startPoint?: Point; // ADDED
  endPoint?: Point; // ADDED
}

export interface AdjustmentLayerData extends BaseLayer {
  type: 'adjustment';
  adjustmentData: {
    type: 'brightness' | 'curves' | 'hsl' | 'grading';
    adjustments?: AdjustmentState;
    curves?: CurvesState;
    hslAdjustments?: HslAdjustmentsState;
    grading?: GradingState;
  };
}

export interface SmartObjectLayerData extends BaseLayer {
  type: 'smart-object';
  smartObjectData: {
    sourceLayerId: string;
    layers: Layer[]; // Layers contained within the smart object
    width?: number;
    height?: number;
  };
  dataUrl: string | null; // ADDED: Rasterized preview of contents
}

export interface GroupLayerData extends BaseLayer {
  type: 'group';
  children: Layer[];
  isExpanded: boolean;
}

export type Layer = ImageLayerData | DrawingLayerData | TextLayerData | VectorShapeLayerData | GradientLayerData | AdjustmentLayerData | SmartObjectLayerData | GroupLayerData;

// --- Type Guards ---

export const isImageLayer = (layer: Layer): layer is ImageLayerData => layer.type === 'image';
export const isDrawingLayer = (layer: Layer): layer is DrawingLayerData => layer.type === 'drawing';
export const isImageOrDrawingLayer = (layer: Layer): layer is ImageLayerData | DrawingLayerData => isImageLayer(layer) || isDrawingLayer(layer);
export const isTextLayer = (layer: Layer): layer is TextLayerData => layer.type === 'text';
export const isVectorShapeLayer = (layer: Layer): layer is VectorShapeLayerData => layer.type === 'vector-shape';
export const isGradientLayer = (layer: Layer): layer is GradientLayerData => layer.type === 'gradient';
export const isAdjustmentLayer = (layer: Layer): layer is AdjustmentLayerData => layer.type === 'adjustment';
export const isSmartObjectLayer = (layer: Layer): layer is SmartObjectLayerData => layer.type === 'smart-object';
export const isGroupLayer = (layer: Layer): layer is GroupLayerData => layer.type === 'group';

// --- State Interfaces (from tools.ts) ---

export interface BrushState extends BrushStateTool {}

export interface GradientToolState extends GradientToolStateTool {}

export interface SelectionSettings extends SelectionSettingsTool {}

export interface EditState {
  adjustments: AdjustmentState;
  effects: EffectState;
  grading: GradingState;
  hslAdjustments: HslAdjustmentsState;
  curves: CurvesState;
  frame: FrameState;
  crop: CropState;
  transform: TransformState;
  rotation: number;
  aspect: number | null;
  selectedFilter: string;
  colorMode: 'rgb' | 'grayscale' | 'cmyk';
  selectiveBlurAmount: number;
  selectiveSharpenAmount: number;
  customHslColor: string;
  selectionSettings: SelectionSettings;
  channels: { r: boolean; g: boolean; b: boolean; alpha: boolean };
  history: HistoryItem[];
  historyBrushSourceIndex: number;
  brushState: BrushState;
  selectiveBlurMask: string | null;
  selectiveSharpenMask: string | null;
  isProxyMode: boolean;
  customFonts: string[];
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

export interface NewProjectSettings {
  width: number;
  height: number;
  dpi: number;
  backgroundColor: string;
  colorMode: 'rgb' | 'grayscale' | 'cmyk';
}

export interface PanelTab {
  id: string;
  name: string;
  icon: Icon; // FIX 1: Use Icon type
  location: 'right' | 'bottom' | 'hidden';
  visible: boolean;
  order: number;
}