import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel"; // Renamed import
import { RightSidebarTabs } from "@/components/layout/RightSidebarTabs"; // FIX 4: Changed to named import
import type { Preset } from "@/hooks/usePresets";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AuxiliaryPanel from "./AuxiliaryPanel";
import { Card } from "@/components/ui/card";
import type { EditState, BrushState, ActiveTool, SelectionSettings } from "@/types/editor";
import { ScrollArea } from "@/components/ui/scroll-area"; // FIX 5, 6, 7, 9: Import ScrollArea

interface SidebarProps {
  // RightSidebarTabs Props
  hasImage: boolean;
  activeTool: ActiveTool | null;
  selectedLayerId: string | null;
  selectedLayer: any;
  layers: any[];
  imgRef: React.RefObject<HTMLImageElement>;
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
  onLayerUpdate: (id: string, updates: Partial<any>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<any>, historyName: string) => void; // Added full commit signature
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  addTextLayer: () => void;
  addDrawingLayer: () => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  addShapeLayer: (coords: { x: number; y: number }, shapeType?: any, initialWidth?: number, initialHeight?: number) => void;
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
  onHslAdjustmentChange: (color: any, key: any, value: number) => void;
  onHslAdjustmentCommit: (color: any, key: any, value: number) => void;
  curves: EditState['curves'];
  onCurvesChange: (channel: any, points: any[]) => void;
  onCurvesCommit: (channel: any, points: any[]) => void;
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
  gradientToolState: any;
  setGradientToolState: React.Dispatch<React.SetStateAction<any>>;
  gradientPresets: any[];
  onSaveGradientPreset: (name: string, state: any) => void;
  onDeleteGradientPreset: (name: string) => void;
  // History Props
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
  // Brushes Props
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  // Selective Blur
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  // HSL Custom Color
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  // Font Manager Props (FIX 4, 8, 24)
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  // Selection Settings
  selectionSettings: SelectionSettings; // NEW
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void; // NEW
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void; // NEW
}

const Sidebar = (props: SidebarProps) => {
  const isMobile = useIsMobile();

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

  const rightSidebarTabsProps = {
    ...props,
    // Explicitly pass font props to satisfy RightSidebarTabsProps
    systemFonts: props.systemFonts,
    customFonts: props.customFonts,
    onOpenFontManager: props.onOpenFontManager,
  };

  if (isMobile) {
    return (
      <div className="h-full w-full">
        <Card className="h-full overflow-y-auto">
          <RightSidebarTabs {...rightSidebarTabsProps} />
        </Card>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <ScrollArea className="h-full">
          <div className="p-4">
            <AuxiliaryPanel {...auxiliaryPanelProps} />
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75} minSize={30}>
        <ScrollArea className="h-full">
          <div className="p-4">
            <RightSidebarTabs {...rightSidebarTabsProps} />
          </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Sidebar;