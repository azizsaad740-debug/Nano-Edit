// src/types/editor/state.ts
import type {
  AdjustmentState,
  EffectState,
  GradingState,
  HslAdjustmentsState,
  ChannelState,
  CurvesState,
  TransformState,
  CropState,
  FrameState,
} from './adjustments'; // REVERT
import type { SelectionSettings, BrushState } from './tools'; // REVERT
import type { Layer } from './layers'; // REVERT

export interface EditState {
  adjustments: AdjustmentState;
  effects: EffectState;
  grading: GradingState;
  hslAdjustments: HslAdjustmentsState;
  channels: ChannelState;
  curves: CurvesState;
  selectedFilter: string;
  transforms: TransformState;
  crop: CropState | null;
  frame: FrameState;
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
  selectiveBlurMask: string | null;
  selectiveBlurAmount: number;
  selectiveSharpenMask: string | null;
  selectiveSharpenAmount: number;
  customHslColor: string;
  selectionSettings: SelectionSettings;
  // ADDED properties used in useEditorLogic/History
  brushState: BrushState;
  history: HistoryItem[];
  historyBrushSourceIndex: number;
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}