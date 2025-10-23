"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Type, Layers, Copy, Merge, FileArchive, Square, Plus, Group, Palette, SquareStack, ArrowDownUp } from "lucide-react"; // Added ArrowDownUp icon
import type { Layer } from "@/hooks/useEditorState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LayerActionsProps {
  layers: Layer[];
  selectedLayer: Layer | undefined;
  selectedLayerIds: string[];
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => void;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  onAddGradientLayer: () => void; // Added onAddGradientLayer
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  selectedShapeType: Layer['shapeType'] | null;
  groupLayers: () => void; // New prop for grouping layers
  hasActiveSelection: boolean; // New prop to check for active selection
  onApplySelectionAsMask: () => void; // New prop for applying selection as mask
  onInvertLayerMask: () => void; // NEW prop
}

export const LayerActions = ({
  layers,
  selectedLayer,
  selectedLayerIds,
  onAddTextLayer,
  onAddDrawingLayer,
  onAddShapeLayer,
  onAddGradientLayer, // Destructure onAddGradientLayer
  onDeleteLayer,
  onDuplicateLayer,
  onMergeLayerDown,
  onRasterizeLayer,
  onCreateSmartObject,
  onOpenSmartObject,
  selectedShapeType,
  groupLayers, // Destructure groupLayers
  hasActiveSelection, // Destructure new prop
  onApplySelectionAsMask, // Destructure new prop
  onInvertLayerMask, // Destructure new prop
}: LayerActionsProps) => {
  const hasMultipleSelection = selectedLayerIds.length > 1;
  const isAnyLayerSelected = selectedLayerIds.length > 0;

  const isMergeable = React.useMemo(() => {
    if (!selectedLayer) return false;
    const layerIndex = layers.findIndex(l => l.id === selectedLayer.id);
    if (layerIndex < 1 || layers[layerIndex - 1].type === 'image') {
      return false;
    }
    return true;
  }, [layers, selectedLayer]);

  const isRasterizable = selectedLayer?.type === 'text' || selectedLayer?.type === 'vector-shape' || selectedLayer?.type === 'gradient'; // Added gradient
  const isSmartObject = selectedLayer?.type === 'smart-object';
  const isMaskable = selectedLayer && selectedLayer.type !== 'image';
  const hasMask = selectedLayer?.maskDataUrl; // Check if selected layer has a mask

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <TooltipProvider>
        <div className="flex flex-wrap gap-1 justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" onClick={onAddTextLayer}>
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Text Layer</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" onClick={onAddDrawingLayer}>
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Drawing Layer</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" onClick={onAddGradientLayer}>
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Gradient Layer</p>
            </TooltipContent>
          </Tooltip>

          {hasMultipleSelection ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onCreateSmartObject(selectedLayerIds)}
                  >
                    <FileArchive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create Smart Object</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={groupLayers} // Call groupLayers here
                    disabled={selectedLayerIds.some(id => layers.find(l => l.id === id)?.type === 'image')} // Disable if background is selected
                  >
                    <Group className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Group Layers</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={onDuplicateLayer}
                    disabled={!selectedLayer || selectedLayer.type === 'image'} // Disable if no layer or background is selected
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicate Layer</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={onMergeLayerDown}
                    disabled={!isMergeable}
                  >
                    <Merge className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Merge Down</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={onRasterizeLayer}
                    disabled={!isRasterizable}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rasterize Layer</p>
                </TooltipContent>
              </Tooltip>

              {isSmartObject && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => selectedLayer.id && onOpenSmartObject(selectedLayer.id)}
                    >
                      <FileArchive className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open Smart Object</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={onApplySelectionAsMask}
                disabled={!hasActiveSelection || !isMaskable}
              >
                <SquareStack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Apply Selection as Mask</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={onInvertLayerMask}
                disabled={!hasMask}
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Invert Layer Mask</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={onDeleteLayer}
                disabled={!isAnyLayerSelected || selectedLayerIds.some(id => layers.find(l => l.id === id)?.type === 'image')} // Disable if no layer selected or background is selected
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Selected Layer</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default LayerActions;