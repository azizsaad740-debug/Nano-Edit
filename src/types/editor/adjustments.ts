// src/types/editor/adjustments.ts
import type { Point } from './core'; // REVERT

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
  grayscale: number;
  sepia: number;
  invert: number;
  shadowsColor: string;
  midtonesColor: string;
  highlightsColor: string;
  shadowsLuminance: number;
  highlightsLuminance: number;
  blending: number;
}

export type HslColorKey = 'global' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface HslAdjustment {
  hue: number;
  saturation: number;
  luminance: number;
}

export interface HslAdjustmentsState {
  global: HslAdjustment;
  red: HslAdjustment;
  orange: HslAdjustment;
  yellow: HslAdjustment;
  green: HslAdjustment;
  aqua: HslAdjustment;
  blue: HslAdjustment;
  purple: HslAdjustment;
  magenta: HslAdjustment;
}

export interface ChannelState {
  r: boolean;
  g: boolean;
  b: boolean;
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
  type: 'none' | 'border' | 'polaroid' | 'film' | 'solid';
  width: number;
  color: string;
  padding?: number;
  radius?: number;
  opacity?: number;
}