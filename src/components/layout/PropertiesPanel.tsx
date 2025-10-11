"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { LayerProperties } from "@/components/editor/LayerProperties";
import TextProperties from "@/components/editor/TextProperties";
import ShapeProperties from "@/components/editor/ShapeProperties";
import GradientProperties from "@/components/editor/GradientProperties";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions"; // Import GradientToolOptions
import type { Layer, ActiveTool, BrushState, GradientToolState } from "@/hooks/useEditorState";

interface PropertiesPanelProps {
  selectedLayer: Layer | undefined;
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<BrushState>) => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>; // Updated type
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
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
  onLayerOpacityChange,
  onLayerOpacityCommit,
  onLayerPropertyCommit,
}: PropertiesPanelProps) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        <ScrollArea className="flex-1 pr-3 pb-2">
          {selectedLayer ? (
            <Accordion type="multiple" className="w-full" defaultValue={['properties']}>
              <AccordionItem value="properties">
                <AccordionTrigger>General Properties</AccordionTrigger>
                <AccordionContent>
                  <LayerProperties
                    selectedLayer={selectedLayer}
                    onOpacityChange={onLayerOpacityChange}
                    onOpacityCommit={onLayerOpacityCommit}
                    onLayerPropertyCommit={(updates, name) => onLayerPropertyCommit(selectedLayer.id, updates, name)}
                  />
                </AccordionContent>
              </AccordionItem>
              {selectedLayer.type === 'text' && (
                <AccordionItem value="text">
                  <AccordionTrigger>Text Properties</AccordionTrigger>
                  <AccordionContent>
                    <TextProperties
                      layer={selectedLayer}
                      onUpdate={onLayerUpdate}
                      onCommit={onLayerCommit}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
              {selectedLayer.type === 'vector-shape' && (
                <AccordionItem value="shape">
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
                <AccordionItem value="gradient">
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
            </Accordion>
          ) : (activeTool === 'brush' || activeTool === 'eraser') ? (
            <BrushOptions
              activeTool={activeTool}
              brushSize={brushState.size}
              setBrushSize={(size) => setBrushState({ size })}
              brushOpacity={brushState.opacity}
              setBrushOpacity={(opacity) => setBrushState({ opacity })}
              brushColor={brushState.color}
              setBrushColor={(color) => setBrushState({ color })}
            />
          ) : activeTool === 'gradient' ? ( // New conditional rendering for GradientToolOptions
            <GradientToolOptions
              gradientToolState={gradientToolState}
              setGradientToolState={setGradientToolState}
            />
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