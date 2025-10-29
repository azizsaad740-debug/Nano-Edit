"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  SlidersHorizontal,
  Layers,
  Settings,
  Brush,
  Droplet,
  Type,
  Square,
  Palette,
  Move,
  MousePointer2,
  Wand2,
  ScanEye,
  SquareDashedMousePointer,
  History,
  PaintBucket,
  Stamp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LayersPanel from "@/components/editor/LayersPanel";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions";
import SelectionToolOptions from "@/components/editor/SelectionToolOptions";
import { PencilOptions } from "@/components/editor/PencilOptions";
import { PaintBucketOptions } from "@/components/editor/PaintBucketOptions";
import { StampOptions } from "@/components/editor/StampOptions";
import { HistoryBrushOptions } from "@/components/editor/HistoryBrushOptions";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import type { Layer, ActiveTool, EditState, BrushState, GradientToolState, SelectionSettings } from "@/types/editor";
import type { Preset } from "@/hooks/usePresets";
import type { GradientPreset } from "@/hooks/useGradientPresets";

interface RightSidebarTabsProps {
  // Core State
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
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  // Global Adjustments Props
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
  onHslAdjustmentChange: (color: keyof EditState['hslAdjustments'], key: keyof GradientToolState, value: number) => void;
  onHslAdjustmentCommit: (color: keyof EditState['hslAdjustments'], key: keyof GradientToolState, value: number) => void;
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
  onSavePreset: () => void;
  onDeletePreset: (name: string) => void;
  // Gradient Presets
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  // History
  history: { name: string }[];
  currentHistoryIndex: number;
  onHistoryJump: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Color Props
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  // Brushes/Tools
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  // Fonts
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  // HSL Custom Color
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  // Selection Settings
  selectionSettings: SelectionSettings;
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void;
}

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const { selectedLayer } = props;
  const [isFontManagerOpen, setIsFontManagerOpen] = React.useState(false);

  const isPaintToolActive = props.activeTool === 'brush' || props.activeTool === 'eraser' || props.activeTool === 'pencil';
  const isSelectionBrushActive = props.activeTool === 'selectionBrush';
  const isBlurBrushActive = props.activeTool === 'blurBrush';
  const isGradientToolActive = props.activeTool === 'gradient';
  const isSelectionToolActive = props.activeTool?.startsWith('marquee') || props.activeTool?.startsWith('lasso') || props.activeTool === 'quickSelect' || props.activeTool === 'magicWand' || props.activeTool === 'objectSelect' || props.activeTool === 'move';
  const isPaintBucketToolActive = props.activeTool === 'paintBucket';
  const isStampToolActive = props.activeTool === 'patternStamp' || props.activeTool === 'cloneStamp';
  const isHistoryBrushToolActive = props.activeTool === 'historyBrush' || props.activeTool === 'artHistoryBrush';

  const handleOpenFontManager = () => {
    setIsFontManagerOpen(true);
  };

  const layerPropertiesContentProps = {
    selectedLayer,
    imgRef: props.imgRef,
    onLayerUpdate: props.onLayerUpdate,
    onLayerCommit: props.onLayerCommit,
    systemFonts: props.systemFonts,
    customFonts: props.customFonts,
    onOpenFontManager: handleOpenFontManager,
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

  const brushOptionsProps = {
    activeTool: props.activeTool as 'brush' | 'eraser' | 'pencil',
    brushSize: props.brushState.size,
    setBrushSize: (size: number) => props.setBrushState({ size }),
    brushOpacity: props.brushState.opacity,
    setBrushOpacity: (opacity: number) => props.setBrushState({ opacity }),
    foregroundColor: props.foregroundColor,
    setForegroundColor: props.onForegroundColorChange,
    brushHardness: props.brushState.hardness,
    setBrushHardness: (hardness: number) => props.setBrushState({ hardness }),
    brushSmoothness: props.brushState.smoothness,
    setBrushSmoothness: (smoothness: number) => props.setBrushState({ smoothness }),
    brushShape: props.brushState.shape,
    setBrushShape: (shape: 'circle' | 'square') => props.setBrushState({ shape }),
    brushFlow: props.brushState.flow,
    setBrushFlow: (flow: number) => props.setBrushState({ flow }),
    brushAngle: props.brushState.angle,
    setBrushAngle: (angle: number) => props.setBrushState({ angle }),
    brushRoundness: props.brushState.roundness,
    setBrushRoundness: (roundness: number) => props.setBrushState({ roundness }),
    brushSpacing: props.brushState.spacing,
    setBrushSpacing: (spacing: number) => props.setBrushState({ spacing }),
    brushBlendMode: props.brushState.blendMode,
    setBrushBlendMode: (blendMode: string) => props.setBrushState({ blendMode: blendMode as Layer['blendMode'] }),
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue="layers" className="w-full h-full flex flex-col">
        <TabsList className="w-full h-10 shrink-0">
          <TabsTrigger value="layers" className="h-8 flex-1">
            <Layers className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="h-8 flex-1" disabled={!props.hasImage}>
            <SlidersHorizontal className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="properties" className="h-8 flex-1" disabled={!selectedLayer && !isSelectionToolActive && !isPaintToolActive && !isGradientToolActive && !isPaintBucketToolActive && !isStampToolActive && !isHistoryBrushToolActive}>
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-4">
          <div className="p-2">
            <TabsContent value="layers">
              <LayersPanel
                layers={props.layers}
                selectedLayerId={props.selectedLayerId}
                onSelectLayer={props.onSelectLayer}
                onReorder={props.onReorder}
                toggleLayerVisibility={props.toggleLayerVisibility}
                renameLayer={props.renameLayer}
                deleteLayer={props.deleteLayer}
                onDuplicateLayer={props.onDuplicateLayer}
                onMergeLayerDown={props.onMergeLayerDown}
                onRasterizeLayer={props.onRasterizeLayer}
                onCreateSmartObject={props.onCreateSmartObject}
                onOpenSmartObject={props.onOpenSmartObject}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
                onLayerOpacityChange={props.onLayerOpacityChange}
                onLayerOpacityCommit={props.onLayerOpacityCommit}
                onAddTextLayer={props.addTextLayer}
                onAddDrawingLayer={props.addDrawingLayer}
                onAddLayerFromBackground={props.onAddLayerFromBackground}
                onLayerFromSelection={props.onLayerFromSelection}
                onAddShapeLayer={props.addShapeLayer}
                onAddGradientLayer={props.addGradientLayer}
                onAddAdjustmentLayer={props.onAddAdjustmentLayer}
                selectedShapeType={props.selectedShapeType}
                groupLayers={props.groupLayers}
                toggleGroupExpanded={props.toggleGroupExpanded}
                hasActiveSelection={props.hasActiveSelection}
                onApplySelectionAsMask={props.onApplySelectionAsMask}
                onRemoveLayerMask={props.onRemoveLayerMask}
                onInvertLayerMask={props.onInvertLayerMask}
                onToggleClippingMask={props.onToggleClippingMask}
                onToggleLayerLock={props.onToggleLayerLock}
                onDeleteHiddenLayers={props.onDeleteHiddenLayers}
                onRasterizeSmartObject={props.onRasterizeSmartObject}
                onConvertSmartObjectToLayers={props.onConvertSmartObjectToLayers}
                onExportSmartObjectContents={props.onExportSmartObjectContents}
                onArrangeLayer={props.onArrangeLayer}
              />
            </TabsContent>

            <TabsContent value="adjustments">
              <GlobalAdjustmentsPanel
                hasImage={props.hasImage}
                adjustments={props.adjustments}
                onAdjustmentChange={props.onAdjustmentChange}
                onAdjustmentCommit={props.onAdjustmentCommit}
                effects={props.effects}
                onEffectChange={props.onEffectChange}
                onEffectCommit={props.onEffectCommit}
                grading={props.grading}
                onGradingChange={props.onGradingChange}
                onGradingCommit={props.onGradingCommit}
                hslAdjustments={props.hslAdjustments}
                onHslAdjustmentChange={props.onHslAdjustmentChange}
                onHslAdjustmentCommit={props.onHslAdjustmentCommit}
                curves={props.curves}
                onCurvesChange={props.onCurvesChange}
                onCurvesCommit={props.onCurvesCommit}
                onFilterChange={props.onFilterChange}
                selectedFilter={props.selectedFilter}
                onTransformChange={props.onTransformChange}
                rotation={props.rotation}
                onRotationChange={props.onRotationChange}
                onRotationCommit={props.onRotationCommit}
                onAspectChange={props.onAspectChange}
                aspect={props.aspect}
                presets={props.presets}
                onApplyPreset={props.onApplyPreset}
                onSavePreset={props.onSavePreset}
                onDeletePreset={props.onDeletePreset}
                frame={props.frame}
                onFramePresetChange={props.onFramePresetChange}
                onFramePropertyChange={props.onFramePropertyChange}
                onFramePropertyCommit={props.onFramePropertyCommit}
                imgRef={props.imgRef}
                customHslColor={props.customHslColor}
                setCustomHslColor={props.setCustomHslColor}
              />
            </TabsContent>

            <TabsContent value="properties">
              {selectedLayer && <LayerPropertiesContent {...layerPropertiesContentProps} />}
              
              {/* Tool Options */}
              {isSelectionToolActive && (
                <SelectionToolOptions
                  activeTool={props.activeTool}
                  settings={props.selectionSettings}
                  onSettingChange={props.onSelectionSettingChange}
                  onSettingCommit={props.onSelectionSettingCommit}
                />
              )}
              
              {isPaintToolActive && (
                <BrushOptions {...brushOptionsProps} />
              )}
              
              {isSelectionBrushActive && (
                <BrushOptions {...brushOptionsProps} />
              )}
              
              {isBlurBrushActive && (
                <BlurBrushOptions
                  selectiveBlurStrength={props.selectiveBlurAmount}
                  onStrengthChange={props.onSelectiveBlurAmountChange}
                  onStrengthCommit={props.onSelectiveBlurAmountCommit}
                />
              )}
              
              {isGradientToolActive && (
                <GradientToolOptions
                  gradientToolState={props.gradientToolState}
                  setGradientToolState={props.setGradientToolState}
                  gradientPresets={props.gradientPresets}
                  onApplyGradientPreset={(preset) => props.setGradientToolState(preset.state)}
                  onSaveGradientPreset={props.onSaveGradientPreset}
                  onDeleteGradientPreset={(name) => props.onDeleteGradientPreset(name)}
                />
              )}
              
              {isPaintBucketToolActive && (
                <PaintBucketOptions />
              )}
              
              {isStampToolActive && (
                <StampOptions />
              )}
              
              {isHistoryBrushToolActive && (
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
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      
      <FontManagerDialog
        open={isFontManagerOpen}
        onOpenChange={setIsFontManagerOpen}
        systemFonts={props.systemFonts}
        setSystemFonts={() => {}} // Stub: System fonts are managed by useFontManager
        customFonts={props.customFonts}
        addCustomFont={() => {}} // Stub
        removeCustomFont={() => {}} // Stub
      />
    </div>
  );
};