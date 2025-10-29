"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Layers,
  SlidersHorizontal,
  Type,
  Square,
  Palette,
  Brush,
  Settings,
  SquareStack,
  Trash2,
  ArrowDownUp,
  CornerUpLeft,
  RotateCcw,
  Download,
  Merge,
  FileArchive,
  Group,
  Minus,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Wand2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LayersPanel from "@/components/editor/LayersPanel";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel";
import { SavePresetDialog } from "@/components/editor/SavePresetDialog";
import { SaveGradientPresetDialog } from "@/components/editor/SaveGradientPresetDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { cn } from "@/lib/utils";
import type { Layer, EditState, ActiveTool, BrushState, GradientToolState, Point, HslAdjustment, SelectionSettings } from "@/types/editor";
import type { Preset } from "@/hooks/usePresets";
import type { GradientPreset } from "@/hooks/useGradientPresets";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import { BrushOptions } from "@/components/editor/BrushOptions";
import LayerGeneralProperties from "@/components/editor/LayerGeneralProperties";
import { TextOptions } from "@/components/editor/TextOptions";
import ShapeOptions from "@/components/editor/ShapeOptions";
import { GradientOptions } from "@/components/editor/GradientOptions";
import { AdjustmentOptions } from "@/components/editor/AdjustmentOptions";
import MaskProperties from "@/components/editor/MaskProperties";
import SelectionToolOptions from "@/components/editor/SelectionToolOptions";
import { PencilOptions } from "@/components/editor/PencilOptions"; // NEW
import { PaintBucketOptions } from "@/components/editor/PaintBucketOptions"; // NEW
import { StampOptions } from "@/components/editor/StampOptions"; // NEW
import { HistoryBrushOptions } from "@/components/editor/HistoryBrushOptions"; // NEW

type HslColorKey = keyof EditState['hslAdjustments'];

interface RightSidebarTabsProps {
  hasImage: boolean;
  activeTool: ActiveTool | null;
  selectedLayerId: string | null;
  selectedLayer: Layer | undefined;
  layers: Layer[];
  imgRef: React.RefObject<HTMLImageElement>;
  // Layer Actions
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
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void; // Added full commit signature
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  // Layer Creation
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
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  // Global Adjustments
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
  frame: EditState['frame'];
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
  // Presets
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  // Gradient Presets
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  // Brush State
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  // Font Manager
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  // Selective Blur
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  // HSL Custom Color
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  // Selection Settings
  selectionSettings: SelectionSettings;
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void;
  // History
  history: { name: string }[];
}

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const { selectedLayer } = props;
  const selectedLayerId = selectedLayer?.id;
  
  const isBrushTool = props.activeTool === 'brush' || props.activeTool === 'eraser';
  const isPencilTool = props.activeTool === 'pencil';
  const isSelectionBrushTool = props.activeTool === 'selectionBrush';
  const isBlurBrushTool = props.activeTool === 'blurBrush';
  const isGradientTool = props.activeTool === 'gradient';
  const isPaintBucketTool = props.activeTool === 'paintBucket';
  const isStampTool = props.activeTool === 'patternStamp' || props.activeTool === 'cloneStamp';
  const isHistoryBrushTool = props.activeTool === 'historyBrush' || props.activeTool === 'artHistoryBrush';
  
  const isSelectionTool = props.activeTool === 'move' || props.activeTool?.startsWith('marquee') || props.activeTool?.startsWith('lasso') || props.activeTool === 'quickSelect' || props.activeTool === 'magicWand' || props.activeTool === 'objectSelect';
  
  const isAnyToolWithOptions = isSelectionTool || isBrushTool || isPencilTool || isSelectionBrushTool || isBlurBrushTool || isGradientTool || isPaintBucketTool || isStampTool || isHistoryBrushTool;

  const [isSavingPreset, setIsSavingPreset] = React.useState(false);
  const [isSavingGradientPreset, setIsSavingGradientPreset] = React.useState(false);
  const [isImportingPreset, setIsImportingPreset] = React.useState(false);

  // Props for LayersPanel
  const layersPanelProps = {
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
    onLayerPropertyCommit: props.onLayerPropertyCommit,
    onLayerOpacityChange: props.onLayerOpacityChange,
    onLayerOpacityCommit: props.onLayerOpacityCommit,
    onAddTextLayer: props.addTextLayer,
    onAddDrawingLayer: props.addDrawingLayer,
    onAddShapeLayer: props.addShapeLayer,
    onAddGradientLayer: props.addGradientLayer,
    onAddAdjustmentLayer: props.onAddAdjustmentLayer,
    onAddLayerFromBackground: props.onAddLayerFromBackground,
    onLayerFromSelection: props.onLayerFromSelection,
    selectedShapeType: props.selectedShapeType,
    groupLayers: props.groupLayers,
    toggleGroupExpanded: props.toggleGroupExpanded,
    onRemoveLayerMask: props.onRemoveLayerMask,
    onInvertLayerMask: props.onInvertLayerMask,
    onToggleClippingMask: props.onToggleClippingMask,
    onToggleLayerLock: props.onToggleLayerLock,
    onDeleteHiddenLayers: props.onDeleteHiddenLayers,
    onRasterizeSmartObject: props.onRasterizeSmartObject,
    onConvertSmartObjectToLayers: props.onConvertSmartObjectToLayers,
    onExportSmartObjectContents: props.onExportSmartObjectContents,
    onArrangeLayer: props.onArrangeLayer,
    hasActiveSelection: props.hasActiveSelection,
    onApplySelectionAsMask: props.onApplySelectionAsMask,
  };

  // Props for LayerPropertiesContent
  const propertiesContentProps = {
    selectedLayer,
    imgRef: props.imgRef,
    onLayerUpdate: props.onLayerUpdate,
    onLayerCommit: props.onLayerCommit,
    systemFonts: props.systemFonts,
    customFonts: props.customFonts,
    onOpenFontManager: props.onOpenFontManager,
    gradientToolState: props.gradientToolState,
    setGradientToolState: props.setGradientToolState,
    gradientPresets: props.gradientPresets,
    onSaveGradientPreset: props.onSaveGradientPreset,
    onDeleteGradientPreset: props.onDeleteGradientPreset,
    customHslColor: props.customHslColor,
    setCustomHslColor: props.setCustomHslColor,
    onRemoveLayerMask: props.onRemoveLayerMask,
    onInvertLayerMask: props.onInvertLayerMask,
  };

  // Props for GlobalAdjustmentsPanel
  const globalAdjustmentsPanelProps = {
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
    onSavePreset: () => setIsSavingPreset(true),
    onDeletePreset: props.onDeletePreset,
    frame: props.frame,
    onFramePresetChange: props.onFramePresetChange,
    onFramePropertyChange: props.onFramePropertyChange,
    onFramePropertyCommit: props.onFramePropertyCommit,
    imgRef: props.imgRef,
    customHslColor: props.customHslColor,
    setCustomHslColor: props.setCustomHslColor,
  };

  return (
    <Tabs defaultValue="layers" className="w-full h-full flex flex-col">
      <TabsList className="w-full h-10 shrink-0">
        <TabsTrigger value="layers" className="h-8 flex-1">
          <Layers className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="properties" className="h-8 flex-1" disabled={!selectedLayer}>
          <SlidersHorizontal className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="adjustments" className="h-8 flex-1">
          <Wand2 className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="tools" className="h-8 flex-1" disabled={!isAnyToolWithOptions}>
          <Brush className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1 mt-4">
        <div className="p-2">
          <TabsContent value="layers">
            <LayersPanel {...layersPanelProps} />
          </TabsContent>

          <TabsContent value="properties">
            {selectedLayer && <LayerPropertiesContent {...propertiesContentProps} />}
          </TabsContent>

          <TabsContent value="adjustments">
            <GlobalAdjustmentsPanel {...globalAdjustmentsPanelProps} />
          </TabsContent>

          <TabsContent value="tools">
            {isSelectionTool && (
              <SelectionToolOptions
                activeTool={props.activeTool}
                settings={props.selectionSettings}
                onSettingChange={props.onSelectionSettingChange}
                onSettingCommit={props.onSelectionSettingCommit}
              />
            )}
            
            {isPencilTool && (
              <PencilOptions
                brushState={props.brushState}
                setBrushState={props.setBrushState}
                foregroundColor={props.foregroundColor}
                setForegroundColor={props.onForegroundColorChange}
              />
            )}

            {(isBrushTool || isSelectionBrushTool) && (
              <BrushOptions
                activeTool={props.activeTool as "brush" | "eraser"}
                brushSize={props.brushState.size}
                setBrushSize={(size) => props.setBrushState({ size })}
                brushOpacity={props.brushState.opacity}
                setBrushOpacity={(opacity) => props.setBrushState({ opacity })}
                foregroundColor={props.foregroundColor}
                setForegroundColor={props.onForegroundColorChange}
                brushHardness={props.brushState.hardness}
                setBrushHardness={(hardness) => props.setBrushState({ hardness })}
                brushSmoothness={props.brushState.smoothness}
                setBrushSmoothness={(smoothness) => props.setBrushState({ smoothness })}
                brushShape={props.brushState.shape}
                setBrushShape={(shape) => props.setBrushState({ shape })}
                // NEW PROPERTIES
                brushFlow={props.brushState.flow}
                setBrushFlow={(flow) => props.setBrushState({ flow })}
                brushAngle={props.brushState.angle}
                setBrushAngle={(angle) => props.setBrushState({ angle })}
                brushRoundness={props.brushState.roundness}
                setBrushRoundness={(roundness) => props.setBrushState({ roundness })}
                brushSpacing={props.brushState.spacing}
                setBrushSpacing={(spacing) => props.setBrushState({ spacing })}
                brushBlendMode={props.brushState.blendMode}
                setBrushBlendMode={(blendMode) => props.setBrushState({ blendMode })}
              />
            )}
            
            {isBlurBrushTool && (
              <BlurBrushOptions
                selectiveBlurStrength={props.selectiveBlurAmount}
                onStrengthChange={props.onSelectiveBlurAmountChange}
                onStrengthCommit={props.onSelectiveBlurAmountCommit}
              />
            )}
            
            {isPaintBucketTool && (
              <PaintBucketOptions />
            )}
            
            {isStampTool && (
              <StampOptions />
            )}
            
            {isHistoryBrushTool && (
              <HistoryBrushOptions 
                activeTool={props.activeTool as 'historyBrush' | 'artHistoryBrush'}
                history={props.history}
                brushSize={props.brushState.size}
                setBrushSize={(size) => props.setBrushState({ size })}
                brushOpacity={props.brushState.opacity}
                setBrushOpacity={(opacity) => props.setBrushState({ opacity })}
                brushFlow={props.brushState.flow}
                setBrushFlow={(flow) => props.setBrushState({ flow })}
              />
            )}

            {!isAnyToolWithOptions && (
              <p className="text-sm text-muted-foreground p-4">
                Select a tool to view its options here.
              </p>
            )}
          </TabsContent>
        </div>
      </ScrollArea>

      <SavePresetDialog
        open={isSavingPreset}
        onOpenChange={setIsSavingPreset}
        onSave={props.onSavePreset}
      />
      <SaveGradientPresetDialog
        open={isSavingGradientPreset}
        onOpenChange={setIsSavingGradientPreset}
        onSave={(name) => props.onSaveGradientPreset(name, props.gradientToolState)}
      />
      <ImportPresetsDialog
        open={isImportingPreset}
        onOpenChange={setIsImportingPreset}
      />
    </Tabs>
  );
};