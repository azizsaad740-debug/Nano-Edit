import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel"; // Renamed import
import { RightSidebarTabs } from "@/components/layout/RightSidebarTabs"; // NEW Import
import type { Preset } from "@/hooks/usePresets";
import type { Point, EditState, HslAdjustment, Layer, BrushState, GradientToolState, ActiveTool, HslColorKey } from "@/types/editor";
import React from "react";

interface SidebarProps {
  hasImage: boolean;
  // Global Adjustment Props
  adjustments: EditState['adjustments'];
  onAdjustmentChange: (adjustment: string, value: number) => void;
  onAdjustmentCommit: (adjustment: string, value: number) => void;
  effects: EditState['effects'];
  onEffectChange: (effect: string, value: number) => void;
  onEffectCommit: (effect: string, value: number) => void;
  grading: EditState['grading'];
  onGradingChange: (gradingType: string, value: number) => void;
  onGradingCommit: (gradingType: string, value: number) => void;
  hslAdjustments: EditState['hslAdjustments'];
  onHslAdjustmentChange: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onHslAdjustmentCommit: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  curves: EditState['curves'];
  onCurvesChange: (channel: keyof EditState['curves'], points: Point[]) => void;
  onCurvesCommit: (channel: keyof EditState['curves'], points: Point[]) => void;
  onFilterChange: (filterValue: string, filterName: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  rotation: number;
  onRotationChange: (value: number) => void;
  onRotationCommit: (value: number) => void;
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onDeletePreset: (name: string) => void;
  frame: EditState['frame'];
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
  // History Props
  history: { name: string }[];
  currentHistoryIndex: number;
  onHistoryJump: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Info Props
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  exifData: any;
  colorMode: EditState['colorMode'];
  // Navigator Props
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  // Channels Props
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  // Layer props
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  deleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeLayerDown: (id: string) => void;
  onRasterizeLayer: (id: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  addTextLayer: () => void;
  addDrawingLayer: () => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  addShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  addGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  selectedShapeType: Layer['shapeType'] | null;
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: () => void;
  onConvertSmartObjectToLayers: () => void;
  onExportSmartObjectContents: () => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  // Tool state props
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  handleColorPick: (color: string) => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  // Selection/Masking
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  // Selective Blur
  selectiveBlurStrength: number;
  onSelectiveBlurStrengthChange: (value: number) => void;
  onSelectiveBlurStrengthCommit: (value: number) => void;
  // Fonts
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  // Color
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  activeTool: ActiveTool | null;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  customHslColor: string; // NEW
  setCustomHslColor: (color: string) => void; // NEW
}

const Sidebar = (props: SidebarProps) => {
  // Props needed for RightSidebarTabs
  const rightSidebarTabsProps = {
    hasImage: props.hasImage,
    // Properties Panel Props
    selectedLayer: props.layers.find(l => l.id === props.selectedLayerId) || null,
    activeTool: props.activeTool,
    brushState: props.brushState,
    setBrushState: props.setBrushState,
    gradientToolState: props.gradientToolState,
    setGradientToolState: props.setGradientToolState,
    onLayerUpdate: props.onLayerUpdate,
    onLayerCommit: props.onLayerCommit,
    onLayerPropertyCommit: props.onLayerPropertyCommit, // FIX 2: Pass the full signature here
    foregroundColor: props.foregroundColor,
    onForegroundColorChange: props.onForegroundColorChange,
    backgroundColor: props.backgroundColor,
    onBackgroundColorChange: props.onBackgroundColorChange,
    onSwapColors: props.onSwapColors,
    selectiveBlurStrength: props.selectiveBlurStrength,
    onSelectiveBlurStrengthChange: props.onSelectiveBlurStrengthChange,
    onSelectiveBlurStrengthCommit: props.onSelectiveBlurStrengthCommit,
    systemFonts: props.systemFonts,
    customFonts: props.customFonts,
    onOpenFontManager: props.onOpenFontManager,
    imgRef: props.imgRef,
    onRemoveLayerMask: props.onRemoveLayerMask,
    onInvertLayerMask: props.onInvertLayerMask,
    gradientPresets: [], // Placeholder, actual presets are managed in Index.tsx
    onSaveGradientPreset: () => {},
    onDeleteGradientPreset: () => {},
    customHslColor: props.customHslColor, // NEW
    setCustomHslColor: props.setCustomHslColor, // NEW
    // Layers Panel Props
    layers: props.layers,
    selectedLayerId: props.selectedLayerId,
    onSelectLayer: props.onSelectLayer,
    onReorder: props.onReorder,
    toggleLayerVisibility: props.toggleLayerVisibility,
    renameLayer: props.renameLayer,
    deleteLayer: props.deleteLayer,
    onDuplicateLayer: props.onDuplicateLayer,
    onMergeLayerDown: props.onMergeLayerDown,
    onRasterizeLayer: props.onRasterizeLayer,
    onCreateSmartObject: props.onCreateSmartObject,
    onOpenSmartObject: props.onOpenSmartObject,
    onLayerOpacityChange: props.onLayerOpacityChange,
    onLayerOpacityCommit: props.onLayerOpacityCommit,
    addTextLayer: props.addTextLayer,
    addDrawingLayer: props.addDrawingLayer,
    onAddLayerFromBackground: props.onAddLayerFromBackground,
    onLayerFromSelection: props.onLayerFromSelection,
    addShapeLayer: props.addShapeLayer,
    addGradientLayer: props.addGradientLayer,
    onAddAdjustmentLayer: props.onAddAdjustmentLayer,
    selectedShapeType: props.selectedShapeType,
    groupLayers: props.groupLayers,
    toggleGroupExpanded: props.toggleGroupExpanded,
    onToggleClippingMask: props.onToggleClippingMask,
    onToggleLayerLock: props.onToggleLayerLock,
    onDeleteHiddenLayers: props.onDeleteHiddenLayers,
    onRasterizeSmartObject: props.onRasterizeSmartObject,
    onConvertSmartObjectToLayers: props.onConvertSmartObjectToLayers,
    onExportSmartObjectContents: props.onExportSmartObjectContents,
    onArrangeLayer: props.onArrangeLayer,
    hasActiveSelection: props.hasActiveSelection,
    onApplySelectionAsMask: props.onApplySelectionAsMask,
    // History Props
    history: props.history,
    currentHistoryIndex: props.currentHistoryIndex,
    onHistoryJump: props.onHistoryJump,
    onUndo: props.onUndo,
    onRedo: props.onRedo,
    canUndo: props.canUndo,
    canRedo: props.canRedo,
    // Info Props
    dimensions: props.dimensions,
    fileInfo: props.fileInfo,
    exifData: props.exifData,
    colorMode: props.colorMode,
    // Navigator Props
    zoom: props.zoom,
    onZoomIn: props.onZoomIn,
    onZoomOut: props.onZoomOut,
    onFitScreen: props.onFitScreen,
    // Channels Props
    channels: props.channels,
    onChannelChange: props.onChannelChange,
    // Brushes/Adjustments Props are passed through auxiliary panel props
  };

  // Props needed for GlobalAdjustmentsPanel
  const globalAdjustmentsProps = {
    hasImage: props.hasImage,
    adjustments: props.adjustments,
    onAdjustmentChange: props.onAdjustmentChange,
    onAdjustmentCommit: props.onAdjustmentCommit,
    effects: props.effects,
    onEffectChange: props.onEffectChange,
    onEffectCommit: props.onEffectCommit,
    grading: props.grading,
    onGradingChange: props.onGradingChange,
    onGradingCommit: props.onGradingCommit,
    hslAdjustments: props.hslAdjustments,
    onHslAdjustmentChange: props.onHslAdjustmentChange,
    onHslAdjustmentCommit: props.onHslAdjustmentCommit,
    curves: props.curves,
    onCurvesChange: props.onCurvesChange,
    onCurvesCommit: props.onCurvesCommit,
    onFilterChange: props.onFilterChange,
    selectedFilter: props.selectedFilter,
    onTransformChange: props.onTransformChange,
    rotation: props.rotation,
    onRotationChange: props.onRotationChange,
    onRotationCommit: props.onRotationCommit,
    onAspectChange: props.onAspectChange,
    aspect: props.aspect,
    presets: props.presets,
    onApplyPreset: props.onApplyPreset,
    onSavePreset: props.onSavePreset,
    onDeletePreset: props.onDeletePreset,
    frame: props.frame,
    onFramePresetChange: props.onFramePresetChange,
    onFramePropertyChange: props.onFramePropertyChange,
    onFramePropertyCommit: props.onFramePropertyCommit,
    imgRef: props.imgRef,
    customHslColor: props.customHslColor, // NEW
    setCustomHslColor: props.setCustomHslColor, // NEW
  };

  return (
    <div className="flex flex-col h-full border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ResizablePanelGroup direction="vertical">
        {/* Top Panel: Global Adjustments */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <Card className="flex flex-col h-full border-none shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Global Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-3">
              <GlobalAdjustmentsPanel {...globalAdjustmentsProps} />
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom Panel: Properties, Layers, and Auxiliary Tabs */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <Card className="flex flex-col h-full border-none shadow-none">
            <CardContent className="flex-1 p-0 h-full">
              <RightSidebarTabs {...rightSidebarTabsProps} />
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Sidebar;