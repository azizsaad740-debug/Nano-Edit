"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrushOptions } from "@/components/editor/BrushOptions";
import TextProperties from "@/components/editor/TextProperties";
import ShapeProperties from "@/components/editor/ShapeProperties";
import GradientProperties from "@/components/editor/GradientProperties";
import AdjustmentProperties from "@/components/editor/AdjustmentProperties";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import LayerGeneralProperties from "../editor/LayerGeneralProperties";
import type { Layer, ActiveTool, BrushState, GradientToolState, HslAdjustment, EditState } from "@/types/editor";
import type { GradientPreset } from "@/hooks/useGradientPresets";

type HslColorKey = keyof EditState['hslAdjustments'];

interface PropertiesPanelProps {
  selectedLayer: Layer | undefined;
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void; // Updated type
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  foregroundColor: string; // New prop
  setForegroundColor: (color: string) => void; // New prop
  // Selective Blur Props
  selectiveBlurStrength: number; // NEW prop
  onSelectiveBlurStrengthChange: (value: number) => void; // NEW prop
  onSelectiveBlurStrengthCommit: (value: number) => void; // NEW prop
  // Fonts
  systemFonts: string[]; // NEW prop
  customFonts: string[]; // NEW prop
  onOpenFontManager: () => void; // NEW prop
  // Image Ref for Curves/Histogram
  imgRef: React.RefObject<HTMLImageElement>; // NEW prop
}

export const PropertiesPanel = ({
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
  foregroundColor, // Destructure new props
  setForegroundColor,
  selectiveBlurStrength, // Destructure NEW props
  onSelectiveBlurStrengthChange,
  onSelectiveBlurStrengthCommit,
  systemFonts, // Destructure NEW props
  customFonts,
  onOpenFontManager,
  imgRef, // Destructure NEW prop
}: PropertiesPanelProps) => {
  const isBrushTool = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush';
  const isBlurBrushTool = activeTool === 'blurBrush';
  const isGradientTool = activeTool === 'gradient';

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        <ScrollArea className="flex-1 pr-3 pb-2">
          {isBrushTool || isBlurBrushTool ? (
            <div className="space-y-4">
              <BrushOptions
                activeTool={activeTool as "brush" | "eraser"}
                brushSize={brushState.size}
                setBrushSize={(size) => setBrushState({ size })}
                brushOpacity={brushState.opacity}
                setBrushOpacity={(opacity) => setBrushState({ opacity })}
                foregroundColor={foregroundColor} // Pass foregroundColor
                setForegroundColor={setForegroundColor} // Pass setForegroundColor
                brushHardness={brushState.hardness} // Pass hardness
                setBrushHardness={(hardness) => setBrushState({ hardness })} // Pass hardness setter
                brushSmoothness={brushState.smoothness} // Pass smoothness
                setBrushSmoothness={(smoothness) => setBrushState({ smoothness })} // Pass smoothness setter
                brushShape={brushState.shape} // Pass brush shape
                setBrushShape={(shape) => setBrushState({ shape })} // Pass brush shape setter
              />
              {isBlurBrushTool && (
                <BlurBrushOptions
                  selectiveBlurStrength={selectiveBlurStrength}
                  onStrengthChange={onSelectiveBlurStrengthChange}
                  onStrengthCommit={onSelectiveBlurStrengthCommit}
                />
              )}
            </div>
          ) : isGradientTool ? (
            <GradientToolOptions
              gradientToolState={gradientToolState}
              setGradientToolState={setGradientToolState}
              gradientPresets={gradientPresets}
              onApplyGradientPreset={(preset) => setGradientToolState(preset.state)}
              onSaveGradientPreset={onSaveGradientPreset}
              onDeleteGradientPreset={onDeleteGradientPreset}
            />
          ) : selectedLayer ? (
            <Accordion type="multiple" className="w-full" defaultValue={['general', 'layer-specific']}>
              
              {/* General Layer Properties */}
              <AccordionItem value="general">
                <AccordionTrigger>General Properties</AccordionTrigger>
                <AccordionContent>
                  <LayerGeneralProperties
                    layer={selectedLayer}
                    onUpdate={onLayerUpdate}
                    onCommit={onLayerCommit}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Layer Specific Properties */}
              {selectedLayer.type === 'text' && (
                <AccordionItem value="layer-specific">
                  <AccordionTrigger>Text Properties</AccordionTrigger>
                  <AccordionContent>
                    <TextProperties
                      layer={selectedLayer}
                      onUpdate={onLayerUpdate}
                      onCommit={onLayerCommit}
                      systemFonts={systemFonts}
                      customFonts={customFonts}
                      onOpenFontManager={onOpenFontManager}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
              {selectedLayer.type === 'vector-shape' && (
                <AccordionItem value="layer-specific">
                  <AccordionTrigger>Shape Properties</AccordionTrigger>
                  <AccordionContent>
                    <ShapeProperties
                      layer={selectedLayer}
                      onUpdate={onLayerUpdate}
                      onCommit={onLayerCommit}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
              {selectedLayer.type === 'gradient' && (
                <AccordionItem value="layer-specific">
                  <AccordionTrigger>Gradient Properties</AccordionTrigger>
                  <AccordionContent>
                    <GradientProperties
                      layer={selectedLayer}
                      onUpdate={onLayerUpdate}
                      onCommit={onLayerCommit}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
              {selectedLayer.type === 'adjustment' && (
                <AccordionItem value="layer-specific">
                  <AccordionTrigger>Adjustment Controls</AccordionTrigger>
                  <AccordionContent>
                    <AdjustmentProperties
                      layer={selectedLayer}
                      onUpdate={onLayerUpdate}
                      onCommit={onLayerCommit}
                      imgRef={imgRef}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-4">
              Select a layer or an active tool to view its properties.
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};