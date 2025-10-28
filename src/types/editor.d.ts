import type { Dispatch, SetStateAction } from "react";

// --- Core Types ---

export type ActiveTool =
  | "move"
  | "lasso"
  | "brush"
  | "eraser"
  | "selectionBrush"
  | "blurBrush"
  | "text"
  | "shape"
  | "gradient"
  | "crop"
  | "eyedropper";

export interface Dimensions {
  width: number;
  height: number;
}

export interface BrushState {
  size: number;
  opacity: number;
  hardness: number;
  smoothness: number;
  shape: 'circle' | 'square';
  color: string; // Note: color is managed by foregroundColor in Index.tsx, but kept here for completeness
}

export interface GradientToolState {
  type: 'linear' | 'radial' | 'angle' | 'reflected' | 'diamond';
  colors: string[];
  stops: number[];
  angle: number;
  centerX: number;
  centerY: number;
  radius: number;
  feather: number;
  inverted: boolean;
}

export interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  gamma: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  clarity: number;
  vibrance: number;
}

export interface EffectState {
  vignette: number;
  grain: number;
  sharpen: number;
  blur: number;
}

export interface GradingState {
  shadowsColor: string;
  midtonesColor: string;
  highlightsColor: string;
  shadowsLuminance: number;
  highlightsLuminance: number;
  blending: number;
}

export interface HslAdjustmentState {
  hue: number;
  saturation: number;
  luminance: number;
}

export interface ChannelState {
  red: number;
  green: number;
  blue: number;
}

export interface CurvesState {
  rgb: [number, number][];
  red: [number, number][];
  green: [number, number][];
  blue: [number, number][];
}

export interface TransformState {
  rotation: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
}

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameState {
  preset: 'none' | 'polaroid' | 'film' | 'border';
  color: string;
  thickness: number;
  padding: number;
  radius: number;
  opacity: number;
}

export interface EditorState {
  adjustments: AdjustmentState;
  effects: EffectState;
  grading: GradingState;
  hslAdjustments: HslAdjustmentState[]; // Array of 6 HSL adjustments
  channels: ChannelState;
  curves: CurvesState;
  selectedFilter: string | null;
  transforms: TransformState;
  crop: CropState;
  frame: FrameState;
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
}

// --- Layer Types ---

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

export interface BaseLayerData {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  blendMode: BlendMode;
  mask?: string; // Data URL of the mask image
  isClippingMask: boolean;
  isLocked: boolean;
}

export interface ImageLayerData extends BaseLayerData {
  type: 'image';
  src: string;
}

export interface DrawingLayerData extends BaseLayerData {
  type: 'drawing';
  path: string; // SVG path data or similar
  color: string;
  size: number;
  hardness: number;
}

export interface ShapeLayerData extends BaseLayerData {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'triangle' | 'polygon';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  radius?: number; // For rounded rectangles
}

export interface GradientLayerData extends BaseLayerData {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  colors: string[];
  stops: number[];
  angle: number;
}

export interface AdjustmentLayerData extends BaseLayerData {
  type: 'adjustment';
  adjustmentType: 'brightness' | 'curves' | 'hsl';
  adjustmentSettings: Partial<AdjustmentState | CurvesState | HslAdjustmentState>;
}

export interface SmartObjectData {
  width: number;
  height: number;
  layers: Layer[];
}

export interface SmartObjectLayerData extends BaseLayerData {
  type: 'smartObject';
  smartObjectData: SmartObjectData;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextVerticalAlignment = 'top' | 'middle' | 'bottom';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TextDecoration = 'none' | 'underline' | 'line-through';

export interface TextWarpData {
  type: 'none' | 'arc' | 'arch' | 'bulge' | 'shell' | 'wave' | 'fish' | 'rise' | 'fisheye' | 'inflate' | 'squeeze' | 'twist' | 'custom';
  bend: number; // -100 to 100
  horizontalDistortion: number;
  verticalDistortion: number;
  customPath?: string; // For custom warping
}

export interface TextLayerData extends BaseLayerData {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  // Spacing
  lineHeight: number; // Leading
  letterSpacing: number; // Tracking
  wordSpacing: number; // Kerning (often handled by letterSpacing in CSS, but kept separate for control)
  baselineShift: number;
  // Alignment & Flow
  textAlignment: TextAlignment;
  verticalAlignment: TextVerticalAlignment; // For Area Type
  indentation: number;
  spaceBefore: number;
  spaceAfter: number;
  hyphenate: boolean;
  // Styles
  textTransform: TextTransform; // All Caps, Small Caps
  textDecoration: TextDecoration; // Underline, Strikethrough
  isSuperscript: boolean;
  isSubscript: boolean;
  // OpenType (Placeholder for future implementation)
  openTypeFeatures: {
    ligatures: boolean;
    swashes: boolean;
    stylisticSet: number;
    fractions: boolean;
  };
  // Warping
  textWarp: TextWarpData;
}

export type LayerData =
  | ImageLayerData
  | DrawingLayerData
  | ShapeLayerData
  | GradientLayerData
  | AdjustmentLayerData
  | SmartObjectLayerData
  | TextLayerData;

export interface Layer extends LayerData {
  id: string;
  name: string;
  isVisible: boolean;
  isGroup: boolean;
  isExpanded: boolean;
  children: Layer[];
}

// --- Project & History Types ---

export interface Project {
  id: string;
  name: string;
  image: string | null; // Base image data URL
  dimensions: Dimensions | null;
  fileInfo: { name: string; size: number; type: string } | null;
  exifData: Record<string, any> | null;
  currentState: EditorState;
  layers: Layer[];
  history: HistoryItem[];
  currentHistoryIndex: number;
  aspect: number;
  selectedLayerId: string | null;
  activeTool: ActiveTool | null;
  brushState: BrushState;
  gradientToolState: GradientToolState;
  selectionPath: string | null; // SVG path for selection
  selectionMaskDataUrl: string | null; // Data URL for selection mask
  selectiveBlurAmount: number;
  foregroundColor: string;
  backgroundColor: string;
  selectedShapeType: Layer['shapeType'] | null;
}

export interface HistoryItem {
  name: string;
  state: EditorState;
  layers: Layer[];
}

// --- Preset Types ---

export interface Preset {
  id: string;
  name: string;
  state: EditorState;
}

export interface GradientPreset {
  id: string;
  name: string;
  state: GradientToolState;
}

// --- Template Types ---

export interface TemplateData {
  name: string;
  description: string;
  image: string;
  project: Omit<Project, 'id' | 'name'>;
}

// Removed explicit exports to rely on ambient declaration structure