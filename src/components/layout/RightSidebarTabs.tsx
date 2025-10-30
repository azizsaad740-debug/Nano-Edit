import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, SlidersHorizontal, Settings, Brush, Palette, LayoutGrid } from "lucide-react";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import SelectionToolOptions from "@/components/editor/SelectionToolOptions";
import { PencilOptions } from "@/components/editor/PencilOptions";
import { PaintBucketOptions } from "@/components/editor/PaintBucketOptions";
import { StampOptions } from "@/components/editor/StampOptions";
import { HistoryBrushOptions } from "@/components/editor/HistoryBrushOptions";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions";
import type { Layer, EditState, HslColorKey, HslAdjustment, GradientToolState, FrameState, Point, BrushState, SelectionSettings, ActiveTool, ShapeType } from "@/types/editor";
import type { Preset } from "@/hooks/usePresets";

interface RightSidebarTabsProps {
  // Layer Props
  layers: Layer[];
  selectedLayerId: string | null;
  selectedLayer: Layer | undefined;
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
  handleDestructiveOperation: (operation: 'delete' | 'fill') => void;
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
  // Channels Props
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  // History for History Brush
  history: { name: string }[];
  historyBrushSourceIndex: number;
  setHistoryBrushSourceIndex: (index: number) => void;
  // Clone Source Point
  cloneSourcePoint: Point | null;
  // Layers Panel Component
  LayersPanel: React.ComponentType<any>;
  // Image Ref
  imgRef: React.RefObject<HTMLImageElement>;
  // Color Props (Needed for LayersPanel/ToolOptions)
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
  
  const isLayerSpecificTool = isTextToolActive || isShapeToolActive || isGradientToolActive;
  const isLayerPropertyPanelActive = isLayerSelected && !isLayerSpecificTool;

  const renderPropertiesContent = () => {
    // 1. Layer Properties (if a layer is selected AND it's not a layer-specific tool)
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
    
    // 2. Tool Options (if a layer-specific tool is active)
    if (isLayerSpecificTool) {
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
    
    // 3. Global Adjustments (if no layer is selected and no layer-specific tool is active)
    if (!isLayerSelected && !isLayerSpecificTool) {
      return (
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
          frame={props.frame}
          onFramePresetChange={props.onFramePresetChange}
          onFramePropertyChange={props.onFramePropertyChange}
          onFramePropertyCommit={props.onFramePropertyCommit}
          imgRef={props.imgRef}
          customHslColor={props.customHslColor}
          setCustomHslColor={props.setCustomHslColor}
          presets={props.presets}
          onApplyPreset={props.onApplyPreset}
          onSavePreset={props.onSavePreset}
          onDeletePreset={props.onDeletePreset}
        />
      );
    }

    return (
      <p className="text-sm text-muted-foreground p-4">
        Select a layer or activate a tool to view properties.
      </p>
    );
  };

  return (
    <Tabs defaultValue="layers" className="w-full h-full flex flex-col">
      <TabsList className="w-full h-10 shrink-0 rounded-none border-b justify-start">
        <TabsTrigger value="layers" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <Layers className="h-4 w-4 mr-1" /> Layers
        </TabsTrigger>
        <TabsTrigger value="channels" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <Palette className="h-4 w-4 mr-1" /> Channels
        </TabsTrigger>
        <TabsTrigger value="properties" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <Settings className="h-4 w-4 mr-1" /> Properties
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
              handleDestructiveOperation={props.handleDestructiveOperation}
            />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelsPanel channels={props.channels} onChannelChange={props.onChannelChange} />
          </TabsContent>

          <TabsContent value="properties">
            {renderPropertiesContent()}
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
};