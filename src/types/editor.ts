// src/types/editor.ts (Index file)

import type { Dispatch, SetStateAction } from "react";

// Core
export type { ActiveTool, Dimensions, Point, ShapeType, NewProjectSettings } from './editor/core';

// Tools
export type { BrushState, GradientToolState, SelectionSettings } from './editor/tools';

// Adjustments
export type { AdjustmentState, EffectState, GradingState, HslColorKey, HslAdjustment, HslAdjustmentsState, ChannelState, CurvesState, TransformState, CropState, FrameState } from './editor/adjustments';

// Layers
export type { BlendMode, BaseLayerData, ImageLayerData, DrawingLayerData, TextLayerData, VectorShapeLayerData, GradientLayerData, AdjustmentLayerData, SmartObjectData, SmartObjectLayerData, GroupLayerData, Layer } from './editor/layers';
export { isVectorShapeLayer, isTextLayer, isDrawingLayer, isImageLayer, isImageOrDrawingLayer } from './editor/layers';

// State
export type { EditState, HistoryItem } from './editor/state';

// Initial State Constants
export { initialHslAdjustment, initialCurvesState, initialSelectionSettings, initialEditState, initialBrushState, initialGradientToolState, initialLayerState, initialHistoryItem } from './editor/initialState';

// Utility
export type { Dispatch, SetStateAction };