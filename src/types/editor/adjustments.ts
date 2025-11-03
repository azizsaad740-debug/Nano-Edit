// src/types/editor/adjustments.ts
import type { Point } from './core';

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

export const initialAdjustmentState: AdjustmentState = {
  brightness: 100,
  contrast: 100,
  exposure: 0,
  saturation: 100,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  clarity: 0,
  dehaze: 0,
  gamma: 1,
  grain: 0,
};

export interface EffectState {
  vignette: number;
  grain: number;
  sharpen: number;
  blur: number;
  hueShift: number;
  noise: number;
  clarity: number;
}

export const initialEffectState: EffectState = {
  vignette: 0,
  grain: 0,
  sharpen: 0,
  blur: 0,
  hueShift: 0,
  noise: 0,
  clarity: 0,
};

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

export const initialGradingState: GradingState = {
  shadows: { hue: 0, saturation: 0, luminosity: 0 },
  midtones: { hue: 0, saturation: 0, luminosity: 0 },
  highlights: { hue: 0, saturation: 0, luminosity: 0 },
  blending: 50,
  balance: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  shadowsColor: '#000000',
  midtonesColor: '#808080',
  highlightsColor: '#FFFFFF',
  shadowsLuminance: 0,
  highlightsLuminance: 100,
};

export type HslColorKey = 'global' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface HslAdjustment {
  hue: number;
  saturation: number;
  lightness: number;
}

export const initialHslAdjustment: HslAdjustment = {
  hue: 0,
  saturation: 0,
  lightness: 0,
};

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

export const initialHslAdjustmentsState: HslAdjustmentsState = {
  master: initialHslAdjustment,
  red: initialHslAdjustment,
  orange: initialHslAdjustment,
  yellow: initialHslAdjustment,
  green: initialHslAdjustment,
  aqua: initialHslAdjustment,
  blue: initialHslAdjustment,
  purple: initialHslAdjustment,
  magenta: initialHslAdjustment,
};

export interface CurvesState {
  all: Point[];
  r: Point[];
  g: Point[];
  b: Point[];
}

export const initialCurvesState: CurvesState = {
  all: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
  r: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
  g: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
  b: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
};

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

export const initialFrameState: FrameState = {
  type: 'none',
  width: 0,
  color: '#000000',
  opacity: 100,
  roundness: 0,
  vignetteAmount: 0,
  vignetteRoundness: 0,
};