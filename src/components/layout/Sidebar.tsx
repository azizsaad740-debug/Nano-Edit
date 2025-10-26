import {
  ResizablePanel,
} from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditorControls from "./EditorControls";
import LayersPanel from "../editor/LayersPanel";
import { ChannelsPanel } from "../editor/ChannelsPanel";
import { Separator } from "@/components/ui/separator";
import type { Preset } from "@/hooks/usePresets";
import type { Point, EditState, HslAdjustment, Layer, BrushState, GradientToolState, ActiveTool, HslColorKey } from "@/types/editor";
import React from "react";

interface SidebarProps {
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
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
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
  history: { name: string }[];
  currentHistoryIndex: number;
  onHistoryJump: (index: number) => void;
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  exifData: any;
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onDeletePreset: (name: string) => void;
  frame: EditState['frame'];
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
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
}

const Sidebar = (props: SidebarProps) => {
  return (
    <div className="flex flex-col h-full border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ResizablePanel defaultSize={50} minSize={20}>
        <Card className="flex flex-col h-full border-none shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Edit</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-3">
            <EditorControls
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
              history={props.history}
              currentHistoryIndex={props.currentHistoryIndex}
              onHistoryJump={props.onHistoryJump}
              dimensions={props.dimensions}
              fileInfo={props.fileInfo}
              imgRef={props.imgRef}
              exifData={props.exifData}
              presets={props.presets}
              onApplyPreset={props.onApplyPreset}
              onSavePreset={props.onSavePreset}
              onDeletePreset={props.onDeletePreset}
              frame={props.frame}
              onFramePresetChange={props.onFramePresetChange}
              onFramePropertyChange={props.onFramePropertyChange}
              onFramePropertyCommit={props.onFramePropertyCommit}
            />
          </CardContent>
        </Card>
      </ResizablePanel>

      <Separator />

      <ResizablePanel defaultSize={50} minSize={20}>
        <Card className="flex flex-col h-full border-none shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Channels</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ChannelsPanel channels={props.channels} onChannelChange={props.onChannelChange} />
          </CardContent>
          <Separator />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Layers</CardTitle>
          </CardHeader>
          <div className="p-4 h-full overflow-y-auto flex flex-col">
            {props.hasImage && (
              <LayersPanel
                layers={props.layers}
                onToggleVisibility={props.toggleLayerVisibility}
                onRename={props.renameLayer}
                onDelete={props.deleteLayer}
                onAddTextLayer={props.addTextLayer}
                onAddDrawingLayer={props.addDrawingLayer}
                onAddLayerFromBackground={props.onAddLayerFromBackground}
                onLayerFromSelection={props.onLayerFromSelection}
                onAddShapeLayer={props.addShapeLayer}
                onAddGradientLayer={props.addGradientLayer}
                onAddAdjustmentLayer={props.onAddAdjustmentLayer}
                onDuplicateLayer={props.onDuplicateLayer}
                onMergeLayerDown={props.onMergeLayerDown}
                onRasterizeLayer={props.onRasterizeLayer}
                onCreateSmartObject={props.onCreateSmartObject}
                onOpenSmartObject={props.onOpenSmartObject}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
                onLayerOpacityChange={props.onLayerOpacityChange}
                onLayerOpacityCommit={props.onLayerOpacityCommit}
                onReorder={props.onReorder}
                selectedLayerId={props.selectedLayerId}
                onSelectLayer={props.onSelectLayer}
                selectedShapeType={props.selectedShapeType}
                groupLayers={props.groupLayers}
                toggleGroupExpanded={props.toggleGroupExpanded}
                onRemoveLayerMask={props.onRemoveLayerMask}
                onInvertLayerMask={props.onInvertLayerMask}
                onToggleClippingMask={props.onToggleClippingMask}
                onToggleLayerLock={props.onToggleLayerLock}
                onDeleteHiddenLayers={props.onDeleteHiddenLayers}
                onRasterizeSmartObject={props.onRasterizeSmartObject}
                onConvertSmartObjectToLayers={props.onConvertSmartObjectToLayers}
                onExportSmartObjectContents={props.onExportSmartObjectContents}
                onArrangeLayer={props.onArrangeLayer}
                hasActiveSelection={props.hasActiveSelection}
                onApplySelectionAsMask={props.onApplySelectionAsMask}
              />
            )}
          </div>
        </Card>
      </ResizablePanel>
    </div>
  );
};

export default Sidebar;