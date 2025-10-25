import EditorControls from "@/components/layout/EditorControls";
import React from "react";
import type { Preset } from "@/hooks/usePresets";
import type { Layer, EditState, Point, ActiveTool, BrushState, GradientToolState, HslAdjustment } from "@/hooks/useEditorState";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { GradientPreset } from "@/hooks/useGradientPresets";

type HslColorKey = keyof EditState['hslAdjustments'];

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
  // Layer props
  layers: Layer[];
  addTextLayer: (coords?: { x: number; y: number }) => void;
  addDrawingLayer: () => string;
  onAddLayerFromBackground: () => void; // NEW prop
  addShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  addGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
  onRasterizeSmartObject: () => void; // NEW prop
  onConvertSmartObjectToLayers: () => void; // NEW prop
  onExportSmartObjectContents: () => void; // NEW prop
  onDeleteHiddenLayers: () => void; // NEW prop
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void; // NEW prop
  onReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  deleteLayer: (id: string) => void;
  // Selection props
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  // Layer editing
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  // Frame props
  frame: EditState['frame'];
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
  // Smart object functions
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  // Shape tool
  selectedShapeType: Layer['shapeType'] | null;
  // Tool state
  activeTool: ActiveTool | null;
  // Brush state
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  // Gradient tool state
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  // Gradient Presets
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  // Grouping
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  // Foreground/Background Colors
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
  // Selective Blur Props
  selectiveBlurStrength: number;
  onSelectiveBlurStrengthChange: (value: number) => void;
  onSelectiveBlurStrengthCommit: (value: number) => void;
  // Layer Masking
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: () => void;
  onToggleLayerLock: (id: string) => void;
  // Fonts
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

const Sidebar = (props: SidebarProps) => {
  return (
    <aside className="h-full border-r bg-muted/40">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="p-4 h-full overflow-y-auto">
            <EditorControls {...props} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={15}>
          <div className="p-4 h-full overflow-y-auto flex flex-col">
            {props.hasImage && (
              <PropertiesPanel
                selectedLayer={props.layers.find(l => l.id === props.selectedLayerId)}
                activeTool={props.activeTool}
                brushState={props.brushState}
                setBrushState={props.setBrushState}
                gradientToolState={props.gradientToolState}
                setGradientToolState={props.setGradientToolState}
                onLayerUpdate={props.onLayerUpdate}
                onLayerCommit={props.onLayerCommit}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
                gradientPresets={props.gradientPresets}
                onSaveGradientPreset={props.onSaveGradientPreset}
                onDeleteGradientPreset={props.onDeleteGradientPreset}
                foregroundColor={props.foregroundColor}
                setForegroundColor={props.setForegroundColor}
                selectiveBlurStrength={props.selectiveBlurStrength}
                onSelectiveBlurStrengthChange={props.onSelectiveBlurStrengthChange}
                onSelectiveBlurStrengthCommit={props.onSelectiveBlurStrengthCommit}
                systemFonts={props.systemFonts}
                customFonts={props.customFonts}
                onOpenFontManager={props.onOpenFontManager}
                imgRef={props.imgRef}
              />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="p-4 h-full overflow-y-auto flex flex-col">
            {props.hasImage && (
              <LayersPanel
                layers={props.layers}
                onToggleVisibility={props.toggleLayerVisibility}
                onRename={props.renameLayer}
                onDelete={props.deleteLayer}
                onAddTextLayer={props.addTextLayer}
                onAddDrawingLayer={props.addDrawingLayer}
                onAddLayerFromBackground={props.onAddLayerFromBackground} // NEW
                onAddShapeLayer={props.addShapeLayer}
                onAddGradientLayer={props.addGradientLayer}
                onAddAdjustmentLayer={props.onAddAdjustmentLayer}
                onDuplicateLayer={props.onDuplicateLayer}
                onMergeLayerDown={props.onMergeLayerDown}
                onRasterizeLayer={props.onRasterizeLayer}
                onRasterizeSmartObject={props.onRasterizeSmartObject} // NEW
                onConvertSmartObjectToLayers={props.onConvertSmartObjectToLayers} // NEW
                onExportSmartObjectContents={props.onExportSmartObjectContents} // NEW
                onDeleteHiddenLayers={props.onDeleteHiddenLayers} // NEW
                onArrangeLayer={props.onArrangeLayer} // NEW
                onReorder={props.onReorder}
                selectedLayerId={props.selectedLayerId}
                onSelectLayer={props.onSelectLayer}
                channels={props.channels}
                onChannelChange={props.onChannelChange}
                onLayerUpdate={props.onLayerUpdate}
                onLayerCommit={props.onLayerCommit}
                onLayerOpacityChange={props.onLayerOpacityChange}
                onLayerOpacityCommit={props.onLayerOpacityCommit}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
                onCreateSmartObject={props.onCreateSmartObject}
                onOpenSmartObject={props.onOpenSmartObject}
                selectedShapeType={props.selectedShapeType}
                activeTool={props.activeTool}
                brushState={props.brushState}
                setBrushState={props.setBrushState}
                groupLayers={props.groupLayers}
                toggleGroupExpanded={props.toggleGroupExpanded}
                hasActiveSelection={props.hasActiveSelection}
                onApplySelectionAsMask={props.onApplySelectionAsMask}
                onRemoveLayerMask={props.onRemoveLayerMask}
                onInvertLayerMask={props.onInvertLayerMask}
                onToggleClippingMask={props.onToggleClippingMask}
                onToggleLayerLock={props.onToggleLayerLock}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default Sidebar;