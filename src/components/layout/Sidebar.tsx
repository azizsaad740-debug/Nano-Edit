import { RightSidebarTabs } from "@/components/layout/RightSidebarTabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EditState, BrushState, ActiveTool, SelectionSettings, Layer, Point, HslAdjustment, HslColorKey, AdjustmentState, GradingState, CurvesState, FrameState } from "@/types/editor";
import type { Preset } from "@/hooks/usePresets";
import type { PanelTab } from "@/types/editor/core";
import * as React from "react";

// Renamed and exported interface
export interface RightSidebarTabsProps {
  // RightSidebarTabs Props
  hasImage: boolean;
  activeTool: ActiveTool | null;
  selectedLayerId: string | null;
  selectedLayer: Layer | undefined;
  layers: Layer[];
  selectedLayerIds: string[]; // NEW
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void; // NEW
  onLayerReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void; // FIX 39
  renameLayer: (id: string, newName: string) => void; // FIX 40
  deleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeLayerDown: (id: string) => void;
  onRasterizeLayer: (id: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void; // FIX 41
  addTextLayer: (coords: Point, color: string) => void;
  addDrawingLayer: (coords: Point, dataUrl: string) => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  addShapeLayer: (coords: Point, shapeType?: any, initialWidth?: number, initialHeight?: number, fillColor?: string, strokeColor?: string) => void;
  addGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  selectedShapeType: any;
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: (id: string) => void;
  onConvertSmartObjectToLayers: (id: string) => void;
  onExportSmartObjectContents: (id: string) => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  handleDestructiveOperation: (operation: 'delete' | 'fill') => void;
  
  // --- Re-added Color Correction Props (Fixes TS2339 errors) ---
  adjustments: AdjustmentState; // FIX 24
  onAdjustmentChange: (adjustment: string, value: number) => void; // FIX 25
  onAdjustmentCommit: (adjustment: string, value: number) => void; // FIX 26
  
  grading: GradingState;
  onGradingChange: (gradingType: string, value: number) => void;
  onGradingCommit: (gradingType: string, value: number) => void;
  
  hslAdjustments: EditState['hslAdjustments'];
  onHslAdjustmentChange: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onHslAdjustmentCommit: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  
  curves: EditState['curves'];
  onCurvesChange: (channel: keyof EditState['curves'], points: Point[]) => void;
  onCurvesCommit: (channel: keyof EditState['curves'], points: Point[]) => void;
  // -------------------------------------------------------------
  
  // --- Global Effects Props (Fixes TS2339 errors) ---
  effects: EditState['effects']; // FIX 24
  onEffectChange: (effect: string, value: number) => void; // FIX 25
  onEffectCommit: (effect: string, value: number) => void; // FIX 26
  onFilterChange: (filterValue: string, filterName: string) => void; // FIX 27
  selectedFilter: string; // FIX 28
  onTransformChange: (transformType: string) => void; // FIX 29
  rotation: number; // FIX 30
  onRotationChange: (value: number) => void; // FIX 31
  onRotationCommit: (value: number) => void; // FIX 32
  onAspectChange: (aspect: number | undefined) => void; // FIX 33
  aspect: number | undefined; // FIX 34
  frame: FrameState; // FIX 35
  onFramePresetChange: (type: FrameState['type'], name: string, options?: { width: number; color: string }) => void; // FIX 36
  onFramePropertyChange: (key: 'width' | 'color' | 'opacity' | 'roundness' | 'vignetteAmount' | 'vignetteRoundness', value: any) => void; // FIX 37
  onFramePropertyCommit: () => void; // FIX 38
  // ---------------------------------------------------

  // Presets
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onDeletePreset: (name: string) => void;
  
  // Gradient Presets
  gradientPresets: any[];
  onSaveGradientPreset: (name: string, state: any) => void;
  onDeleteGradientPreset: (name: string) => void;
  
  // Tool State
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  onBrushCommit: () => void;
  gradientToolState: any;
  setGradientToolState: React.Dispatch<React.SetStateAction<any>>;
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  selectiveSharpenAmount: number;
  onSelectiveSharpenAmountChange: (value: number) => void;
  onSelectiveSharpenAmountCommit: (value: number) => void;
  cloneSourcePoint: Point | null;
  selectionSettings: SelectionSettings;
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void;
  history: any[];
  currentHistoryIndex: number;
  historyBrushSourceIndex: number;
  setHistoryBrushSourceIndex: (index: number) => void;
  
  // Global State
  currentEditState: EditState;
  imgRef: React.RefObject<HTMLImageElement>;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  
  // Panel Management
  panelLayout: PanelTab[];
  reorderPanelTabs: (activeId: string, overId: string, newLocation: 'right' | 'bottom') => void;
  activeRightTab: string;
  setActiveRightTab: (id: string) => void;
  activeBottomTab: string;
  setActiveBottomTab: (id: string) => void;
  
  // AI Results (NEW)
  onImageResult: (resultUrl: string, historyName: string) => void;
  onMaskResult: (maskDataUrl: string, historyName: string) => void;
  onOpenSettings: () => void;
  
  // History/View
  onHistoryJump: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  isGuest: boolean; // NEW
}

const Sidebar: React.FC<RightSidebarTabsProps> = (props) => {
  return (
    <ScrollArea className="h-full">
      <RightSidebarTabs {...props} />
    </ScrollArea>
  );
};

export default Sidebar;