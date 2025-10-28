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
import LayerGeneralProperties from "./LayerGeneralProperties";
import { BrushOptions } from "./BrushOptions";
import ShapeOptions from "./ShapeOptions";
import { GradientOptions } from "./GradientOptions";
import { AdjustmentOptions } from "./AdjustmentOptions";
import { BlurBrushOptions } from "./BlurBrushOptions";
import { TextOptions } from "./TextOptions";
import MaskProperties from "./MaskProperties"; // NEW Import
import { Settings, Type, Square, Palette, SlidersHorizontal, SquareStack } from "lucide-react"; // Import icons

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
  // Masking props
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
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
  onRemoveLayerMask,
  onInvertLayerMask,
}) => {
  const isBrushActive = activeTool === 'brush' || activeTool === 'eraser';
  const isBlurBrushActive = activeTool === 'blurBrush';
  const isAnyBrushActive = isBrushActive || isBlurBrushActive;

  const handleLayerUpdateWrapper = (updates: Partial<Layer>) => {
    if (selectedLayer) {
      onLayerUpdate(selectedLayer.id, updates);
    }
  };

  const handleLayerCommitWrapper = (historyName: string) => {
    if (selectedLayer) {
      onLayerCommit(selectedLayer.id, historyName);
    }
  };

  const handleLayerPropertyCommitWrapper = (historyName: string) => {
    if (selectedLayer) {
      // This wrapper is used by LayerOptions/LayerGeneralProperties for simple commits
      onLayerPropertyCommit(selectedLayer.id, historyName);
    }
  };

  const layerType = selectedLayer?.type;
  const hasMask = !!selectedLayer?.maskDataUrl;

  const defaultTab = React.useMemo(() => {
    if (!selectedLayer) return 'tool';
    if (layerType === 'text') return 'text';
    if (layerType === 'vector-shape') return 'shape';
    if (layerType === 'adjustment') return 'adjustment';
    if (layerType === 'gradient') return 'gradient';
    return 'general';
  }, [selectedLayer, layerType]);

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {/* 1. Tool Options (Always visible if a brush tool is active) */}
        {isAnyBrushActive && (
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
        )}

        {/* 2. Layer Properties (Tabbed) */}
        {selectedLayer && (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full h-10">
              <TabsTrigger value="general" className="h-8 flex-1">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
              {layerType === 'text' && (
                <TabsTrigger value="text" className="h-8 flex-1">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
              )}
              {layerType === 'vector-shape' && (
                <TabsTrigger value="shape" className="h-8 flex-1">
                  <Square className="h-4 w-4" />
                </TabsTrigger>
              )}
              {layerType === 'gradient' && (
                <TabsTrigger value="gradient" className="h-8 flex-1">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
              )}
              {layerType === 'adjustment' && (
                <TabsTrigger value="adjustment" className="h-8 flex-1">
                  <SlidersHorizontal className="h-4 w-4" />
                </TabsTrigger>
              )}
              {hasMask && (
                <TabsTrigger value="mask" className="h-8 flex-1">
                  <SquareStack className="h-4 w-4" />
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <LayerGeneralProperties
                layer={selectedLayer}
                onUpdate={(id, updates) => handleLayerUpdateWrapper(updates)}
                onCommit={(id) => handleLayerPropertyCommitWrapper(`Change Layer General Property`)}
              />
            </TabsContent>

            {layerType === 'text' && (
              <TabsContent value="text" className="mt-4">
                <TextOptions
                  layer={selectedLayer}
                  onLayerUpdate={handleLayerUpdateWrapper}
                  onLayerCommit={handleLayerCommitWrapper}
                  systemFonts={systemFonts}
                  customFonts={customFonts}
                  onOpenFontManager={onOpenFontManager}
                />
              </TabsContent>
            )}

            {layerType === 'vector-shape' && (
              <TabsContent value="shape" className="mt-4">
                <ShapeOptions
                  layer={selectedLayer}
                  onLayerUpdate={handleLayerUpdateWrapper}
                  onLayerCommit={handleLayerCommitWrapper}
                />
              </TabsContent>
            )}

            {layerType === 'gradient' && (
              <TabsContent value="gradient" className="mt-4">
                <GradientOptions
                  layer={selectedLayer}
                  onLayerUpdate={handleLayerUpdateWrapper}
                  onLayerCommit={handleLayerCommitWrapper}
                  gradientToolState={gradientToolState}
                  setGradientToolState={setGradientToolState}
                  gradientPresets={gradientPresets}
                  onSaveGradientPreset={onSaveGradientPreset}
                  onDeleteGradientPreset={onDeleteGradientPreset}
                />
              </TabsContent>
            )}

            {layerType === 'adjustment' && (
              <TabsContent value="adjustment" className="mt-4">
                <AdjustmentOptions
                  layer={selectedLayer}
                  onLayerUpdate={handleLayerUpdateWrapper}
                  onLayerCommit={handleLayerCommitWrapper}
                  imgRef={imgRef}
                />
              </TabsContent>
            )}
            
            {hasMask && (
              <TabsContent value="mask" className="mt-4">
                <MaskProperties
                  layer={selectedLayer}
                  onRemoveMask={onRemoveLayerMask}
                  onInvertMask={onInvertLayerMask}
                  onLayerUpdate={handleLayerUpdateWrapper}
                  onLayerCommit={handleLayerCommitWrapper}
                />
              </TabsContent>
            )}
          </Tabs>
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