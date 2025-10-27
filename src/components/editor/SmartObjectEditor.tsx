"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Layer, ActiveTool, BrushState, GradientToolState } from "@/types/editor";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel";
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import { SmartObjectLayersPanel } from "./SmartObjectLayersPanel";
import { useSmartObjectLayers } from "@/hooks/useSmartObjectLayers";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { X, Undo2, Redo2, Save } from "lucide-react";
import * as React from "react";

interface SmartObjectEditorProps {
  smartObject: Layer;
  onClose: () => void;
  onSave: (updatedLayers: Layer[]) => void;
  mainImage: string | null;
  // Tool state passed from parent
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  selectedShapeType: Layer['shapeType'] | null;
  setSelectedShapeType: (type: Layer['shapeType'] | null) => void;
  imgRef: React.RefObject<HTMLImageElement>;
  // NEW FONT PROPS
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

export const SmartObjectEditor = ({ 
  smartObject, 
  onClose, 
  onSave, 
  mainImage, 
  activeTool,
  setActiveTool,
  brushState,
  setBrushState,
  foregroundColor,
  onForegroundColorChange,
  backgroundColor,
  onBackgroundColorChange,
  onSwapColors,
  selectedShapeType,
  setSelectedShapeType,
  imgRef,
  systemFonts, // Destructure new props
  customFonts,
  onOpenFontManager,
}: SmartObjectEditorProps) => {
  const smartObjectDimensions = smartObject.smartObjectData || { width: 1000, height: 1000 };

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
    initialLayers: smartObject.smartObjectData?.layers || [],
    smartObjectDimensions,
    foregroundColor,
    backgroundColor,
    selectedShapeType,
  });

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  useHotkeys("ctrl+z, cmd+z", handleUndo, { preventDefault: true });
  useHotkeys("ctrl+y, cmd+shift+z", handleRedo, { preventDefault: true });

  const handleSave = () => {
    onSave(layers);
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard all changes to this Smart Object?")) {
      onClose();
    }
  };

  // Dummy state for PropertiesPanel requirements (since we don't have full editor state here)
  const dummyGradientToolState: GradientToolState = { type: 'linear', colors: [], stops: [], angle: 0, centerX: 0, centerY: 0, radius: 0, feather: 0, inverted: false };
  const dummyPresets = [];
  const dummySetGradientToolState = () => {};
  const dummyOnSaveGradientPreset = () => {};
  const dummyOnDeleteGradientPreset = () => {};
  
  // Dummy Selective Blur Props (Selective blur is a global effect, not managed inside SO)
  const dummySelectiveBlurStrength = 50;
  const dummyOnSelectiveBlurStrengthChange = React.useCallback((value: number) => {
    // No operation needed in Smart Object context
  }, []);
  const dummyOnSelectiveBlurStrengthCommit = React.useCallback((value: number) => {
    // No operation needed in Smart Object context
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="flex items-center justify-between h-16 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Edit Smart Object: {smartObject.name}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDiscard}>
            <X className="h-4 w-4 mr-2" />
            Discard Changes
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <ToolsPanel 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
          foregroundColor={foregroundColor} 
          onForegroundColorChange={onForegroundColorChange} 
          backgroundColor={backgroundColor} 
          onBackgroundColorChange={onBackgroundColorChange} 
          onSwapColors={onSwapColors} 
          brushState={brushState} 
          setBrushState={setBrushState} 
          selectiveBlurStrength={dummySelectiveBlurStrength}
          onSelectiveBlurStrengthChange={dummyOnSelectiveBlurStrengthChange}
          onSelectiveBlurStrengthCommit={dummyOnSelectiveBlurStrengthCommit}
        />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Middle Panel: Workspace Preview */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col p-4">
              <h3 className="font-medium mb-2 text-center">Preview ({smartObjectDimensions.width}x{smartObjectDimensions.height})</h3>
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <SmartObjectWorkspace
                  layers={layers}
                  width={smartObjectDimensions.width}
                  height={smartObjectDimensions.height}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={setSelectedLayerId}
                  onLayerUpdate={handleLayerUpdate}
                  onLayerCommit={handleLayerCommit}
                  mainImage={mainImage}
                  activeTool={activeTool}
                />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          
          {/* Right Panel: Properties and Layers */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
            <ResizablePanelGroup direction="vertical">
              {/* Properties Panel */}
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="p-4 h-full overflow-y-auto flex flex-col">
                  <PropertiesPanel
                    selectedLayer={selectedLayer}
                    activeTool={activeTool}
                    brushState={brushState}
                    setBrushState={setBrushState}
                    gradientToolState={dummyGradientToolState}
                    setGradientToolState={dummySetGradientToolState}
                    onLayerUpdate={handleLayerUpdate}
                    onLayerCommit={handleLayerCommit}
                    onLayerPropertyCommit={handleLayerPropertyCommit}
                    gradientPresets={dummyPresets}
                    onSaveGradientPreset={dummyOnSaveGradientPreset}
                    onDeleteGradientPreset={dummyOnDeleteGradientPreset}
                    foregroundColor={foregroundColor}
                    setForegroundColor={onForegroundColorChange}
                    selectiveBlurStrength={dummySelectiveBlurStrength}
                    onSelectiveBlurStrengthChange={dummyOnSelectiveBlurStrengthChange}
                    onSelectiveBlurStrengthCommit={dummyOnSelectiveBlurStrengthCommit}
                    systemFonts={systemFonts}
                    customFonts={customFonts}
                    onOpenFontManager={onOpenFontManager}
                    imgRef={imgRef}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              {/* Layers Panel */}
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="p-4 h-full overflow-y-auto flex flex-col">
                  <SmartObjectLayersPanel
                    layers={layers}
                    selectedLayerId={selectedLayerId}
                    selectedLayer={selectedLayer}
                    onSelectLayer={setSelectedLayerId}
                    onReorder={handleReorder}
                    onToggleVisibility={handleToggleVisibility}
                    onLayerPropertyCommit={handleLayerPropertyCommit}
                    onLayerOpacityChange={handleLayerOpacityChange}
                    onLayerOpacityCommit={handleLayerOpacityCommit}
                    handleAddTextLayer={handleAddTextLayer}
                    handleAddDrawingLayer={handleAddDrawingLayer}
                    handleAddShapeLayer={handleAddShapeLayer}
                    handleAddGradientLayer={handleAddGradientLayer}
                    handleDeleteLayer={handleDeleteLayer}
                    handleDuplicateLayer={handleDuplicateLayer}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};