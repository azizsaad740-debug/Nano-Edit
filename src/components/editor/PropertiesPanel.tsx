"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Layer,
  ActiveTool,
  BrushState,
  GradientToolState,
} from "@/types/editor";
import { LayerOptions } from "./LayerOptions";
import { BrushOptions } from "./BrushOptions";
import { ShapeOptions } from "./ShapeOptions";
import { GradientOptions } from "./GradientOptions";
import { AdjustmentOptions } from "./AdjustmentOptions";
import { BlurBrushOptions } from "./BlurBrushOptions";
import { TextOptions } from "./TextOptions";

// Re-import TextLayerData locally for clarity, relying on ambient declaration from editor.ts
type TextLayerData = Layer['textLayerData'];


interface PropertiesPanelProps {
  selectedLayer: Layer | null;
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onLayerCommit: (layerId: string, historyName: string) => void;
  onLayerPropertyCommit: (layerId: string, historyName: string) => void;
  gradientPresets: { id: string; name: string; state: GradientToolState }[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (id: string) => void;
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
  selectiveBlurStrength: number;
  onSelectiveBlurStrengthChange: (value: number) => void;
  onSelectiveBlurStrengthCommit: (value: number) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  imgRef: React.RefObject<HTMLImageElement>;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedLayer,
  activeTool,
  brushState,
  setBrushState,
  gradientToolState,
  setGradientToolState,
  onLayerUpdate,
  onLayerCommit,
  onLayerPropertyCommit,
  gradientPresets,
  onSaveGradientPreset,
  onDeleteGradientPreset,
  foregroundColor,
  setForegroundColor,
  selectiveBlurStrength,
  onSelectiveBlurStrengthChange,
  onSelectiveBlurStrengthCommit,
  systemFonts,
  customFonts,
  onOpenFontManager,
  imgRef,
}) => {
  const isBrushActive = activeTool === 'brush' || activeTool === 'eraser';
  const isBlurBrushActive = activeTool === 'blurBrush';
  const isAnyBrushActive = isBrushActive || isBlurBrushActive;

  const handleLayerUpdate = (updates: Partial<Layer>) => {
    if (selectedLayer) {
      onLayerUpdate(selectedLayer.id, updates);
    }
  };

  const handleLayerCommit = (historyName: string) => {
    if (selectedLayer) {
      onLayerCommit(selectedLayer.id, historyName);
    }
  };

  const handleLayerPropertyCommit = (historyName: string) => {
    if (selectedLayer) {
      onLayerPropertyCommit(selectedLayer.id, historyName);
    }
  };

  const renderLayerSpecificOptions = () => {
    if (!selectedLayer) return null;

    switch (selectedLayer.type) {
      case 'text':
        return (
          <TextOptions
            layer={selectedLayer as Layer & TextLayerData}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
            systemFonts={systemFonts}
            customFonts={customFonts}
            onOpenFontManager={onOpenFontManager}
          />
        );
      case 'vector-shape': // Corrected from 'shape'
        return (
          <ShapeOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
          />
        );
      case 'gradient':
        return (
          <GradientOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
            gradientToolState={gradientToolState}
            setGradientToolState={setGradientToolState}
            gradientPresets={gradientPresets}
            onSaveGradientPreset={onSaveGradientPreset}
            onDeleteGradientPreset={onDeleteGradientPreset}
          />
        );
      case 'adjustment':
        return (
          <AdjustmentOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
            onLayerPropertyCommit={handleLayerPropertyCommit}
          />
        );
      case 'drawing':
      case 'image':
      case 'smart-object': // Corrected from 'smartObject'
      case 'group':
      default:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base">Layer Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {selectedLayer.type === 'image' && 'This is an image layer. Use the main sidebar for global adjustments.'}
                {selectedLayer.type === 'drawing' && 'This is a drawing layer. Use the brush tool for editing.'}
                {selectedLayer.type === 'smart-object' && 'This is a Smart Object. Double-click to edit contents.'}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {/* 1. Layer Options (Always visible if a layer is selected) */}
        {selectedLayer && (
          <LayerOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerPropertyCommit={handleLayerPropertyCommit}
          />
        )}

        {/* 2. Layer Specific Content Options */}
        {selectedLayer && renderLayerSpecificOptions()}

        {/* 3. Tool Options (Only visible if a brush tool is active) */}
        {isAnyBrushActive && (
          <>
            <Separator />
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-base">Tool Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBrushActive && (
                  <BrushOptions
                    activeTool={activeTool as "brush" | "eraser"}
                    brushSize={brushState.size}
                    setBrushSize={(size) => setBrushState({ size })}
                    brushOpacity={brushState.opacity}
                    setBrushOpacity={(opacity) => setBrushState({ opacity })}
                    foregroundColor={foregroundColor}
                    setForegroundColor={setForegroundColor}
                    brushHardness={brushState.hardness}
                    setBrushHardness={(hardness) => setBrushState({ hardness })}
                    brushSmoothness={brushState.smoothness}
                    setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
                    brushShape={brushState.shape}
                    setBrushShape={(shape) => setBrushState({ shape })}
                  />
                )}
                {isBlurBrushActive && (
                  <BlurBrushOptions
                    selectiveBlurStrength={selectiveBlurStrength}
                    onStrengthChange={onSelectiveBlurStrengthChange}
                    onStrengthCommit={onSelectiveBlurStrengthCommit}
                  />
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedLayer && !isAnyBrushActive && (
          <div className="text-center py-10 text-muted-foreground">
            Select a layer or an active tool to view properties.
          </div>
        )}
      </div>
    </ScrollArea>
  );
};