import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Layers, SlidersHorizontal, History, Palette, Settings, Brush, Move, Type, Crop, Frame, Droplet, Zap, Shapes, PaintBucket, Stamp, Pencil, History as HistoryIcon } from "lucide-react";
import LayerList from "@/components/editor/LayerList";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import { AdjustmentOptions } from "@/components/editor/AdjustmentOptions";
import HistoryPanel from "@/components/auxiliary/HistoryPanel";
import ColorPanel from "@/components/auxiliary/ColorPanel";
import AuxiliaryPanel from "@/components/layout/AuxiliaryPanel";
import { TextOptions } from "@/components/editor/TextOptions";
import CropComponent from "@/components/editor/Crop"; // Renamed to avoid conflict
import Frames from "@/components/editor/Frames"; // Renamed to avoid conflict
import { BrushOptions } from "@/components/editor/BrushOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import SelectionToolOptions from "@/components/editor/SelectionToolOptions";
import { PencilOptions } from "@/components/editor/PencilOptions";
import { PaintBucketOptions } from "@/components/editor/PaintBucketOptions";
import { StampOptions } from "@/components/editor/StampOptions";
import { HistoryBrushOptions } from "@/components/editor/HistoryBrushOptions";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions";
import ShapeOptions from "@/components/editor/ShapeOptions";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import InfoPanel from "@/components/auxiliary/InfoPanel";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel"; // ADDED IMPORT
import { GradientOptions } from "@/components/editor/GradientOptions"; // ADDED IMPORT
import type { Layer, EditState, HslColorKey, HslAdjustment, GradientToolState, FrameState, Point, BrushState, SelectionSettings, ActiveTool, ShapeType } from "@/types/editor";
import type { Preset } from "@/hooks/usePresets"; // Import Preset type

interface RightSidebarTabsProps {
  // Layer Props
  layers: Layer[];
  selectedLayerId: string | null;
  selectedLayer: Layer | undefined;
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void; // Renamed from onToggleVisibility
  renameLayer: (id: string, newName: string) => void; // Renamed from onRename
  deleteLayer: (id: string) => void; // Renamed from onDelete
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
  addTextLayer: (coords: Point, color: string) => void;
  addDrawingLayer: () => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  addShapeLayer: (coords: Point, shapeType?: ShapeType, initialWidth?: number, initialHeight?: number, fillColor?: string, strokeColor?: string) => void;
  addGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  selectedShapeType: ShapeType | null;
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
  // Global Adjustments Props
  hasImage: boolean;
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
  frame: FrameState;
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
  gradientPresets: { id: string; name: string; state: GradientToolState }[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  // Brush State
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  // Selective Blur
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  // HSL Custom Color
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  // Font Manager Props
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  // Active Tool
  activeTool: ActiveTool | null;
  // Selection Settings
  selectionSettings: SelectionSettings;
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void;
  // History for History Brush
  history: { name: string }[];
  // Clone Source Point
  cloneSourcePoint: Point | null;
  // Layers Panel Component (passed from Sidebar)
  LayersPanel: React.ComponentType<any>;
  // Image Ref
  imgRef: React.RefObject<HTMLImageElement>;
  // Color Props
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
}

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const { activeTool, selectedLayer, brushState, setBrushState, selectiveBlurAmount, onSelectiveBlurAmountChange, onSelectiveBlurAmountCommit, history, cloneSourcePoint } = props;

  const isLayerSelected = !!selectedLayer;
  const isTextToolActive = activeTool === 'text';
  const isShapeToolActive = activeTool === 'shape';
  const isGradientToolActive = activeTool === 'gradient';
  const isCropToolActive = activeTool === 'crop';
  
  // FIX: Define tool flags correctly
  const isBrushToolActive = activeTool === 'brush';
  const isEraserToolActive = activeTool === 'eraser';
  const isPencilToolActive = activeTool === 'pencil';
  const isBlurBrushActive = activeTool === 'blurBrush'; 
  
  const isSelectionBrushToolActive = activeTool === 'selectionBrush' || isBlurBrushActive;
  const isGradientToolActiveOnly = activeTool === 'gradient'; 
  const isPaintBucketActive = activeTool === 'paintBucket';
  const isStampToolActive = activeTool === 'cloneStamp' || activeTool === 'patternStamp';
  const isHistoryBrushActive = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
  const isSelectionToolActive = activeTool?.includes('select') || activeTool?.startsWith('marquee') || activeTool?.startsWith('lasso') || activeTool === 'move';

  const isLayerSpecificTool = isTextToolActive || isShapeToolActive || isGradientToolActive;
  const isLayerPropertyPanelActive = isLayerSelected && !isLayerSpecificTool;

  // Helper functions to route updates to the selected layer
  const handleLayerUpdate = (updates: Partial<Layer>) => {
    if (selectedLayer) {
      props.onLayerUpdate(selectedLayer.id, updates);
    }
  };

  const handleLayerCommit = (historyName: string) => {
    if (selectedLayer) {
      props.onLayerCommit(selectedLayer.id, historyName);
    }
  };

  const renderToolOptions = () => {
    if (isBrushToolActive || isEraserToolActive || isPencilToolActive) {
      return (
        <BrushOptions
          activeTool={activeTool as 'brush' | 'eraser' | 'pencil'}
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          foregroundColor={props.foregroundColor}
          setForegroundColor={props.onForegroundColorChange}
          brushHardness={brushState.hardness}
          setBrushHardness={(hardness) => setBrushState({ hardness })}
          brushSmoothness={brushState.smoothness}
          setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
          brushShape={brushState.shape}
          setBrushShape={(shape) => setBrushState({ shape })}
          brushFlow={brushState.flow}
          setBrushFlow={(flow) => setBrushState({ flow })}
          brushAngle={brushState.angle}
          setBrushAngle={(angle) => setBrushState({ angle })}
          brushRoundness={brushState.roundness}
          setBrushRoundness={(roundness) => setBrushState({ roundness })}
          brushSpacing={brushState.spacing}
          setBrushSpacing={(spacing) => setBrushState({ spacing })}
          brushBlendMode={brushState.blendMode}
          setBrushBlendMode={(blendMode) => setBrushState({ blendMode })}
        />
      );
    }
    
    if (isPencilToolActive) {
      return (
        <PencilOptions
          brushState={brushState}
          setBrushState={setBrushState}
          foregroundColor={props.foregroundColor}
          setForegroundColor={props.onForegroundColorChange}
        />
      );
    }

    if (isSelectionBrushToolActive) {
      // Use BrushOptions for selection brush size/hardness/opacity
      return (
        <BrushOptions
          activeTool="brush" 
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          foregroundColor={props.foregroundColor}
          setForegroundColor={props.onForegroundColorChange}
          brushHardness={brushState.hardness}
          setBrushHardness={(hardness) => setBrushState({ hardness })}
          brushSmoothness={brushState.smoothness}
          setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
          brushShape={brushState.shape}
          setBrushShape={(shape) => setBrushState({ shape })}
          brushFlow={brushState.flow}
          setBrushFlow={(flow) => setBrushState({ flow })}
          brushAngle={brushState.angle}
          setBrushAngle={(angle) => setBrushState({ angle })}
          brushRoundness={brushState.roundness}
          setBrushRoundness={(roundness) => setBrushState({ roundness })}
          brushSpacing={brushState.spacing}
          setBrushSpacing={(spacing) => setBrushState({ spacing })}
          brushBlendMode={brushState.blendMode}
          setBrushBlendMode={(blendMode) => setBrushState({ blendMode })}
        />
      );
    }

    if (isBlurBrushActive) {
      return (
        <BlurBrushOptions
          selectiveBlurStrength={selectiveBlurAmount}
          onStrengthChange={onSelectiveBlurAmountChange}
          onStrengthCommit={onSelectiveBlurAmountCommit}
        />
      );
    }
    
    if (isPaintBucketActive) {
      return <PaintBucketOptions />;
    }
    
    if (isStampToolActive) {
      return <StampOptions cloneSourcePoint={cloneSourcePoint} />;
    }
    
    if (isHistoryBrushActive) {
      return (
        <HistoryBrushOptions
          activeTool={activeTool as 'historyBrush' | 'artHistoryBrush'}
          history={history}
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          brushFlow={brushState.flow}
          setBrushFlow={(flow) => setBrushState({ flow })}
        />
      );
    }
    
    if (isGradientToolActiveOnly) {
      return (
        <GradientToolOptions
          gradientToolState={props.gradientToolState}
          setGradientToolState={props.setGradientToolState}
          gradientPresets={props.gradientPresets}
          onApplyGradientPreset={(preset) => props.setGradientToolState(preset.state)}
          onSaveGradientPreset={props.onSaveGradientPreset}
          onDeleteGradientPreset={props.onDeleteGradientPreset}
        />
      );
    }

    if (isSelectionToolActive) {
      return (
        <SelectionToolOptions
          activeTool={activeTool}
          settings={props.selectionSettings}
          onSettingChange={props.onSelectionSettingChange}
          onSettingCommit={props.onSelectionSettingCommit}
        />
      );
    }

    return (
      <p className="text-sm text-muted-foreground p-4">
        Select a tool to view its specific options here.
      </p>
    );
  };

  const renderLayerProperties = () => {
    if (isTextToolActive && selectedLayer?.type === 'text') {
      return (
        <TextOptions
          layer={selectedLayer}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
          systemFonts={props.systemFonts}
          customFonts={props.customFonts}
          onOpenFontManager={props.onOpenFontManager}
        />
      );
    }
    
    if (isShapeToolActive && selectedLayer?.type === 'vector-shape') {
      return (
        <ShapeOptions
          layer={selectedLayer}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
        />
      );
    }
    
    if (isGradientToolActive && selectedLayer?.type === 'gradient') {
      return (
        <GradientOptions // FIX: Use GradientOptions for layer properties
          layer={selectedLayer}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
          gradientToolState={props.gradientToolState}
          setGradientToolState={props.setGradientToolState}
          gradientPresets={props.gradientPresets}
          onSaveGradientPreset={props.onSaveGradientPreset}
          onDeleteGradientPreset={props.onDeleteGradientPreset}
        />
      );
    }

    if (isLayerPropertyPanelActive) {
      return (
        <LayerPropertiesContent
          selectedLayer={selectedLayer}
          imgRef={props.imgRef}
          onLayerUpdate={props.onLayerUpdate}
          onLayerCommit={props.onLayerCommit}
          systemFonts={props.systemFonts}
          customFonts={props.customFonts}
          onOpenFontManager={props.onOpenFontManager}
          gradientToolState={props.gradientToolState}
          setGradientToolState={props.setGradientToolState}
          gradientPresets={props.gradientPresets}
          onSaveGradientPreset={props.onSaveGradientPreset}
          onDeleteGradientPreset={props.onDeleteGradientPreset}
          customHslColor={props.customHslColor}
          setCustomHslColor={props.setCustomHslColor}
          onRemoveLayerMask={props.onRemoveLayerMask}
          onInvertLayerMask={props.onInvertLayerMask}
        />
      );
    }

    return (
      <p className="text-sm text-muted-foreground p-4">
        Select a layer or activate a layer-specific tool (Text, Shape, Gradient) to view properties.
      </p>
    );
  };

  return (
    <Tabs defaultValue="layers" className="w-full h-full flex flex-col">
      <TabsList className="w-full h-10 shrink-0">
        <TabsTrigger value="layers" className="h-8 flex-1">
          <Layers className="h-4 w-4 mr-1" /> Layers
        </TabsTrigger>
        <TabsTrigger value="adjustments" className="h-8 flex-1">
          <SlidersHorizontal className="h-4 w-4 mr-1" /> Adjust
        </TabsTrigger>
        <TabsTrigger value="properties" className="h-8 flex-1" disabled={!isLayerSelected && !isLayerSpecificTool}>
          <Settings className="h-4 w-4 mr-1" /> Properties
        </TabsTrigger>
        <TabsTrigger value="tool-options" className="h-8 flex-1">
          <Brush className="h-4 w-4 mr-1" /> Tool Options
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1 mt-4">
        <div className="p-2">
          <TabsContent value="layers">
            <props.LayersPanel
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
              onAddTextLayer={(coords) => props.addTextLayer(coords, props.foregroundColor)}
              onAddDrawingLayer={props.addDrawingLayer}
              onAddLayerFromBackground={props.onAddLayerFromBackground}
              onLayerFromSelection={props.onLayerFromSelection}
              onAddShapeLayer={(coords, shapeType, initialWidth, initialHeight) => props.addShapeLayer(coords, shapeType, initialWidth, initialHeight, props.foregroundColor, props.backgroundColor)}
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
            {renderLayerProperties()}
          </TabsContent>
          
          <TabsContent value="tool-options">
            {renderToolOptions()}
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
};