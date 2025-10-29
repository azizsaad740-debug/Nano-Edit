"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Save, Undo2, Redo2, Maximize, Minimize, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Layer, ActiveTool } from "@/types/editor";
import { useSmartObjectLayers } from "@/hooks/useSmartObjectLayers";
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent"; // Updated import
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SmartObjectLayersPanel } from "./SmartObjectLayersPanel";
import { useHotkeys } from "react-hotkeys-hook";
import { useIsMobile } from "@/hooks/use-mobile";
import { WorkspaceControls } from "./WorkspaceControls";
import type { BrushState, GradientToolState } from "@/types/editor";
import { SlidersHorizontal, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface SmartObjectEditorProps {
  layer: Layer;
  onClose: () => void;
  onSave: (updatedLayers: Layer[]) => void;
  foregroundColor: string;
  backgroundColor: string;
  selectedShapeType: Layer['shapeType'] | null;
  brushState: BrushState;
  gradientToolState: GradientToolState;
  setBrushState: React.Dispatch<React.SetStateAction<BrushState>>;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  setActiveTool: (tool: ActiveTool | null) => void;
  setSelectedShapeType: (type: Layer['shapeType'] | null) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitScreen: () => void;
}

export const SmartObjectEditor: React.FC<SmartObjectEditorProps> = ({
  layer: smartObjectLayer,
  onClose,
  onSave,
  foregroundColor,
  backgroundColor,
  selectedShapeType,
  brushState,
  gradientToolState,
  setBrushState,
  setGradientToolState,
  setActiveTool,
  setSelectedShapeType,
  zoom,
  setZoom,
  handleZoomIn,
  handleZoomOut,
  handleFitScreen,
}) => {
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const isMobile = useIsMobile();

  const { smartObjectData } = smartObjectLayer;
  const smartObjectDimensions = {
    width: smartObjectData?.width || 1000,
    height: smartObjectData?.height || 1000,
  };

  const {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    handleUndo,
    handleRedo,
    handleReorder,
    handleLayerUpdate,
    handleLayerCommit,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    handleAddTextLayer,
    handleAddDrawingLayer,
    handleAddShapeLayer,
    handleAddGradientLayer,
    handleDeleteLayer,
    handleDuplicateLayer,
    handleToggleVisibility,
    handleDrawingStrokeEnd,
    canUndo,
    canRedo,
  } = useSmartObjectLayers({
    initialLayers: smartObjectData?.layers || [],
    smartObjectDimensions,
    foregroundColor,
    backgroundColor,
    selectedShapeType,
  });

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  useHotkeys('ctrl+z, cmd+z', handleUndo, { enableOnFormTags: true }, [handleUndo]);
  useHotkeys('ctrl+y, cmd+y', handleRedo, { enableOnFormTags: true }, [handleRedo]);
  useHotkeys('f', handleFitScreen, { enableOnFormTags: true }, [handleFitScreen]);
  useHotkeys('+, =', handleZoomIn, { enableOnFormTags: true }, [handleZoomIn]);
  useHotkeys('-', handleZoomOut, { enableOnFormTags: true }, [handleZoomOut]);

  const handleSaveAndClose = () => {
    onSave(layers);
  };

  const handleLayerUpdateWrapper = (id: string, updates: Partial<Layer>) => {
    handleLayerUpdate(id, updates);
  };

  const handleLayerCommitWrapper = (id: string, historyName: string) => {
    handleLayerCommit(id); // Smart object layers commit to internal history
  };

  const handleLayerOpacityChangeWrapper = (opacity: number) => {
    if (selectedLayerId) {
      handleLayerOpacityChange(opacity);
    }
  };

  const handleLayerOpacityCommitWrapper = () => {
    if (selectedLayerId) {
      handleLayerOpacityCommit();
    }
  };

  // Stubbed Font Manager functions for Smart Object Editor
  const systemFonts: string[] = ["Roboto", "Arial"];
  const customFonts: string[] = [];
  const onOpenFontManager = () => console.log("Font Manager stub in SO Editor");

  const propertiesContentProps = {
    selectedLayer,
    imgRef: React.useRef(null), // Not strictly needed for SO layers, but required by component interface
    onLayerUpdate: handleLayerUpdateWrapper,
    onLayerCommit: handleLayerCommitWrapper,
    systemFonts,
    customFonts,
    onOpenFontManager,
    gradientToolState,
    setGradientToolState,
    gradientPresets: [], // Stub
    onSaveGradientPreset: () => console.log("Save Gradient Preset stub in SO Editor"), // Stub
    onDeleteGradientPreset: () => console.log("Delete Gradient Preset stub in SO Editor"), // Stub
    customHslColor: foregroundColor, // Stub
    setCustomHslColor: () => console.log("Set Custom HSL Color stub in SO Editor"), // Stub
    onRemoveLayerMask: () => console.log("Remove Mask stub in SO Editor"), // Stub
    onInvertLayerMask: () => console.log("Invert Mask stub in SO Editor"), // Stub
  };

  return (
    <div className={cn("flex flex-col h-screen w-screen bg-background", isFullscreen ? 'absolute inset-0 z-50' : 'relative')}>
      <header className="flex items-center justify-between h-12 px-4 border-b bg-muted/50 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">
            Editing Smart Object: {smartObjectLayer.name}
          </h1>
          <span className="text-sm text-muted-foreground">
            ({smartObjectDimensions.width}x{smartObjectDimensions.height} px)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRedo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSaveAndClose} size="sm">
            <Save className="h-4 w-4 mr-2" /> Save & Close
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0">
        {/* Left Sidebar (Tools Panel) - Simplified for SO Editor */}
        <ToolsPanel
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
          foregroundColor={foregroundColor}
          onForegroundColorChange={() => {}} // Stub
          backgroundColor={backgroundColor}
          onBackgroundColorChange={() => {}} // Stub
          onSwapColors={() => {}} // Stub
          brushState={brushState}
          setBrushState={(updates) => setBrushState(prev => ({ ...prev, ...updates }))}
          selectiveBlurStrength={0} // Not applicable in SO Editor
          onSelectiveBlurStrengthChange={() => {}} // Not applicable
          onSelectiveBlurStrengthCommit={() => {}} // Not applicable
        />

        {/* Main Workspace Area */}
        <div className="flex-1 relative bg-muted/50 overflow-hidden">
          <div
            ref={workspaceRef}
            className="relative w-full h-full overflow-hidden flex items-center justify-center"
          >
            <div
              className="relative shadow-2xl border border-border bg-background"
              style={{
                width: smartObjectDimensions.width,
                height: smartObjectDimensions.height,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <SmartObjectWorkspace
                layers={layers}
                parentDimensions={smartObjectDimensions}
                containerRef={workspaceRef}
                onUpdate={handleLayerUpdateWrapper}
                onCommit={handleLayerCommitWrapper}
                selectedLayerId={selectedLayerId}
                activeTool={activeTool}
                globalSelectedLayerId={selectedLayerId || ''}
                zoom={zoom}
              />
            </div>
            <WorkspaceControls
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitScreen={handleFitScreen}
            />
          </div>
        </div>

        {/* Right Sidebar (Layers & Properties) */}
        <aside className="w-80 shrink-0 border-l bg-sidebar flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Tabs defaultValue="layers" className="w-full h-full flex flex-col">
              <TabsList className="w-full h-10 shrink-0">
                <TabsTrigger value="layers" className="h-8 flex-1">
                  <Layers className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="properties" className="h-8 flex-1" disabled={!selectedLayer}>
                  <SlidersHorizontal className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <div className="p-2">
                  <TabsContent value="layers">
                    <SmartObjectLayersPanel
                      layers={layers}
                      selectedLayerId={selectedLayerId}
                      selectedLayer={selectedLayer}
                      onSelectLayer={setSelectedLayerId}
                      onReorder={handleReorder}
                      onToggleVisibility={handleToggleVisibility}
                      onLayerPropertyCommit={handleLayerPropertyCommit}
                      onLayerOpacityChange={handleLayerOpacityChangeWrapper}
                      onLayerOpacityCommit={handleLayerOpacityCommitWrapper}
                      handleAddTextLayer={handleAddTextLayer}
                      handleAddDrawingLayer={handleAddDrawingLayer}
                      handleAddShapeLayer={handleAddShapeLayer}
                      handleAddGradientLayer={handleAddGradientLayer}
                      handleDeleteLayer={handleDeleteLayer}
                      handleDuplicateLayer={handleDuplicateLayer}
                    />
                  </TabsContent>

                  <TabsContent value="properties">
                    {selectedLayer && <LayerPropertiesContent {...propertiesContentProps} />}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </aside>
      </main>
    </div>
  );
};