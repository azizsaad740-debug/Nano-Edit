// src/types/editor/adjustments.ts
import type { Point } from './core'; // REVERT

export interface AdjustmentState {
  brightness: number;
  contrast: number;
  exposure: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  clarity: number;
  dehaze: number;
  gamma: number;
  grain: number;
}

export interface EffectState {
  vignette: number;
  grain: number;
  sharpen: number;
  blur: number;
  hueShift: number;
  noise: number;
  clarity: number;
}

export interface GradingState {
  shadows: { hue: number; saturation: number; luminosity: number };
  midtones: { hue: number; saturation: number; luminosity: number };
  highlights: { hue: number; saturation: number; luminosity: number };
  blending: number;
  balance: number;
  grayscale: number;
  sepia: number;
  invert: number;
  shadowsColor: string;
  midtonesColor: string;
  highlightsColor: string;
  shadowsLuminance: number;
  highlightsLuminance: number;
}

export type HslColorKey = 'master' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface HslAdjustment {
  hue: number;
  saturation: number;
  lightness: number;
}

export interface HslAdjustmentsState {
  master: HslAdjustment;
  red: HslAdjustment;
  orange: HslAdjustment;
  yellow: HslAdjustment;
  green: HslAdjustment;
  aqua: HslAdjustment;
  blue: HslAdjustment;
  purple: HslAdjustment;
  magenta: HslAdjustment;
}

export interface CurvesState {
  all: Point[];
  r: Point[];
  g: Point[];
  b: Point[];
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
  unit: 'px' | '%';
  aspect?: number;
}

export interface FrameState {
  type: 'none' | 'border' | 'polaroid' | 'film' | 'solid' | 'vignette'; // Added 'vignette' and 'solid'
  width: number; // Used as size/padding
  color: string;
  padding?: number;
  radius?: number;
  opacity: number; // Added
  roundness: number; // Added
  vignetteAmount: number; // Added
  vignetteRoundness: number; // Added
}