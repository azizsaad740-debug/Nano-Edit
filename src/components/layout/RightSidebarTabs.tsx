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
  Settings,
  History,
  Palette,
  Info,
  LayoutGrid,
  Brush,
  PenTool,
  SlidersHorizontal,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Preset } from "@/hooks/usePresets";
import type { GradientPreset } from "@/hooks/useGradientPresets"; // NEW Import
import type { Point, EditState, HslAdjustment, Layer, BrushState, GradientToolState, ActiveTool, HslColorKey } from "@/types/editor";

// Import Panel Components
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import LayersPanel from "@/components/editor/LayersPanel";
import HistoryPanel from "@/components/auxiliary/HistoryPanel";
import ColorPanel from "@/components/auxiliary/ColorPanel";
import InfoPanel from "@/components/auxiliary/InfoPanel";
import NavigatorPanel from "@/components/auxiliary/NavigatorPanel";
import BrushesPanel from "@/components/auxiliary/BrushesPanel";
import PathsPanel from "@/components/auxiliary/PathsPanel";
import AdjustmentsPanel from "@/components/auxiliary/AdjustmentsPanel";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";

interface RightSidebarTabsProps {
  hasImage: boolean;
  // Properties Panel Props
  selectedLayer: Layer | null;
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onLayerCommit: (layerId: string, historyName: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void; 
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  selectiveBlurStrength: number;
  onSelectiveBlurStrengthChange: (value: number) => void;
  onSelectiveBlurStrengthCommit: (value: number) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  imgRef: React.RefObject<HTMLImageElement>;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  customHslColor: string; // NEW
  setCustomHslColor: (color: string) => void; // NEW
  // Layers Panel Props
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
  onToggleClippingMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: () => void;
  onConvertSmartObjectToLayers: () => void;
  onExportSmartObjectContents: () => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
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
  // Gradient Presets (UPDATED)
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
}

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const { selectedLayer } = props;
  const selectedLayerId = selectedLayer?.id;

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
    onLayerPropertyCommit: props.onLayerPropertyCommit, // Full commit signature (needed by LayersPanel)
    onLayerOpacityChange: props.onLayerOpacityChange,
    onLayerOpacityCommit: props.onLayerOpacityCommit,
    addTextLayer: props.addTextLayer,
    addDrawingLayer: props.addDrawingLayer,
    onAddLayerFromBackground: props.onAddLayerFromBackground,
    onLayerFromSelection: props.onLayerFromSelection,
    addShapeLayer: props.addShapeLayer,
    onAddGradientLayer: props.addGradientLayer,
    onAddAdjustmentLayer: props.onAddAdjustmentLayer,
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

  // Props for PropertiesPanel
  const propertiesPanelProps = {
    selectedLayer: props.selectedLayer,
    activeTool: props.activeTool,
    brushState: props.brushState,
    setBrushState: props.setBrushState,
    gradientToolState: props.gradientToolState,
    setGradientToolState: props.setGradientToolState,
    onLayerUpdate: props.onLayerUpdate,
    onLayerCommit: props.onLayerCommit, // Simple commit (id, name)
    // FIX 1: PropertiesPanel expects the simple commit signature here too.
    onLayerPropertyCommit: props.onLayerCommit, // Pass the simple commit function (id, name)
    gradientPresets: props.gradientPresets,
    onSaveGradientPreset: props.onSaveGradientPreset,
    onDeleteGradientPreset: props.onDeleteGradientPreset,
    foregroundColor: props.foregroundColor,
    setForegroundColor: props.onForegroundColorChange,
    selectiveBlurStrength: props.selectiveBlurStrength,
    onSelectiveBlurStrengthChange: props.onSelectiveBlurStrengthChange,
    onSelectiveBlurStrengthCommit: props.onSelectiveBlurStrengthCommit,
    systemFonts: props.systemFonts,
    customFonts: props.customFonts,
    onOpenFontManager: props.onOpenFontManager,
    imgRef: props.imgRef,
    onRemoveLayerMask: props.onRemoveLayerMask,
    onInvertLayerMask: props.onInvertLayerMask,
    customHslColor: props.customHslColor, // NEW
    setCustomHslColor: props.setCustomHslColor, // NEW
  };

  // Props for Auxiliary Panels (used for multiple panels)
  const auxiliaryPanelProps = {
    hasImage: props.hasImage,
    history: props.history,
    currentHistoryIndex: props.currentHistoryIndex,
    onHistoryJump: props.onHistoryJump,
    onUndo: props.onUndo,
    onRedo: props.onRedo,
    canUndo: props.canUndo,
    canRedo: props.canRedo,
    foregroundColor: props.foregroundColor,
    onForegroundColorChange: props.onForegroundColorChange,
    backgroundColor: props.backgroundColor,
    onBackgroundColorChange: props.onBackgroundColorChange,
    onSwapColors: props.onSwapColors,
    dimensions: props.dimensions,
    fileInfo: props.fileInfo,
    imgRef: props.imgRef,
    exifData: props.exifData,
    colorMode: props.colorMode,
    zoom: props.zoom,
    onZoomIn: props.onZoomIn,
    onZoomOut: props.onZoomOut,
    onFitScreen: props.onFitScreen,
    channels: props.channels,
    onChannelChange: props.onChannelChange,
    brushState: props.brushState,
    setBrushState: props.setBrushState,
    onAddAdjustmentLayer: props.onAddAdjustmentLayer,
  };

  return (
    <Tabs defaultValue="layers" className="w-full h-full flex flex-col">
      <TooltipProvider>
        <TabsList className="w-full h-10 shrink-0">
          <Tooltip>
            <TabsTrigger value="layers" className="h-8 flex-1">
              <Layers className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Layers</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="properties" className="h-8 flex-1">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Properties</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="history" className="h-8 flex-1">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>History</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="color" className="h-8 flex-1">
              <Palette className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Color</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="info" className="h-8 flex-1">
              <Info className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Info</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="navigator" className="h-8 flex-1">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Navigator</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="brushes" className="h-8 flex-1">
              <Brush className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Brushes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="paths" className="h-8 flex-1">
              <PenTool className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Paths</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="channels" className="h-8 flex-1">
              <SlidersHorizontal className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Channels</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="adjustments" className="h-8 flex-1">
              <SlidersHorizontal className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Adjustments</TooltipContent>
          </Tooltip>
        </TabsList>
      </TooltipProvider>

      <ScrollArea className="flex-1 mt-4">
        <div className="p-4 pt-0">
          <TabsContent value="layers">
            {props.hasImage ? <LayersPanel {...layersPanelProps} /> : <p className="text-sm text-muted-foreground">Load an image to manage layers.</p>}
          </TabsContent>
          <TabsContent value="properties">
            <PropertiesPanel {...propertiesPanelProps} />
          </TabsContent>
          
          {/* Auxiliary Panels */}
          <TabsContent value="history">
            <HistoryPanel 
              history={auxiliaryPanelProps.history}
              currentIndex={auxiliaryPanelProps.currentHistoryIndex}
              onJump={auxiliaryPanelProps.onHistoryJump}
              onUndo={auxiliaryPanelProps.onUndo}
              onRedo={auxiliaryPanelProps.onRedo}
              canUndo={auxiliaryPanelProps.canUndo}
              canRedo={auxiliaryPanelProps.canRedo}
            />
          </TabsContent>
          
          <TabsContent value="color">
            <ColorPanel {...auxiliaryPanelProps} />
          </TabsContent>
          <TabsContent value="info">
            <InfoPanel {...auxiliaryPanelProps} />
          </TabsContent>
          
          <TabsContent value="navigator">
            <NavigatorPanel 
              image={props.hasImage ? props.imgRef.current?.src || null : null}
              zoom={auxiliaryPanelProps.zoom}
              onZoomIn={auxiliaryPanelProps.onZoomIn}
              onZoomOut={auxiliaryPanelProps.onZoomOut}
              onFitScreen={auxiliaryPanelProps.onFitScreen}
              dimensions={auxiliaryPanelProps.dimensions}
            />
          </TabsContent>
          
          <TabsContent value="brushes">
            <BrushesPanel {...auxiliaryPanelProps} />
          </TabsContent>
          <TabsContent value="paths">
            <PathsPanel />
          </TabsContent>
          <TabsContent value="channels">
            <ChannelsPanel {...auxiliaryPanelProps} />
          </TabsContent>
          <TabsContent value="adjustments">
            <AdjustmentsPanel {...auxiliaryPanelProps} />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
};