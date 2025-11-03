"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Type, Layers, Copy, Merge, FileArchive, Square, Plus, Group, Palette, SquareStack, CornerUpLeft, RotateCcw, Download, Minus, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import type { Layer, SmartObjectLayerData, ShapeType } from "@/types/editor";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LayerActionsProps {
  layers: Layer[];
  selectedLayer: Layer | undefined;
  selectedLayerIds: string[];
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => void;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: ShapeType, initialWidth?: number, initialHeight?: number) => void;
  onAddGradientLayer: () => void;
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  selectedShapeType: ShapeType | null;
  groupLayers: () => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  onInvertLayerMask: () => void;
  onToggleClippingMask: () => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: () => void;
  onConvertSmartObjectToLayers: () => void;
  onExportSmartObjectContents: () => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
}

export const LayerActions = ({
  layers,
  selectedLayer,
  selectedLayerIds,
  onAddTextLayer,
  onAddDrawingLayer,
  onAddShapeLayer,
  onAddGradientLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMergeLayerDown,
  onRasterizeLayer,
  onCreateSmartObject,
  onOpenSmartObject,
  selectedShapeType,
  groupLayers,
  hasActiveSelection,
  onApplySelectionAsMask,
  onInvertLayerMask,
  onToggleClippingMask,
  onDeleteHiddenLayers,
  onRasterizeSmartObject,
  onConvertSmartObjectToLayers,
  onExportSmartObjectContents,
  onArrangeLayer,
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

  const isRasterizable = selectedLayer?.type === 'text' || selectedLayer?.type === 'vector-shape' || selectedLayer?.type === 'gradient';
  const isSmartObject = selectedLayer?.type === 'smart-object';
  const isMaskable = selectedLayer && selectedLayer.type !== 'image';
  const hasMask = selectedLayer?.maskDataUrl;
  
  const selectedLayerIndex = layers.findIndex(l => l.id === selectedLayer?.id);
  const isClippingMaskable = selectedLayer && selectedLayer.type !== 'image' && selectedLayerIndex > 0;
  const isClipped = selectedLayer?.isClippingMask;

  const iconSize = "h-3.5 w-3.5";
  const buttonSize = "h-8 w-8";

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <TooltipProvider>
        {/* Layer Arrangement */}
        <div className="flex flex-wrap gap-1 justify-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className={buttonSize} variant="outline" onClick={() => onArrangeLayer('front')} disabled={!isAnyLayerSelected}>
                <ArrowUpToLine className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Bring to Front</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className={buttonSize} variant="outline" onClick={() => onArrangeLayer('forward')} disabled={!isAnyLayerSelected}>
                <ArrowUp className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Bring Forward</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className={buttonSize} variant="outline" onClick={() => onArrangeLayer('backward')} disabled={!isAnyLayerSelected}>
                <ArrowDown className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Send Backward</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className={buttonSize} variant="outline" onClick={() => onArrangeLayer('back')} disabled={!isAnyLayerSelected}>
                <ArrowDownToLine className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Send to Back</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Core Layer Actions */}
        <div className="flex flex-wrap gap-1 justify-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onDuplicateLayer}
                disabled={!selectedLayer || selectedLayer.type === 'image'}
              >
                <Copy className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Duplicate Layer</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onMergeLayerDown}
                disabled={!isMergeable}
              >
                <Merge className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Merge Down</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onRasterizeLayer}
                disabled={!isRasterizable}
              >
                <Layers className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Rasterize Layer</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onDeleteLayer}
                disabled={!isAnyLayerSelected || selectedLayerIds.some(id => layers.find(l => l.id === id)?.type === 'image')}
              >
                <Trash2 className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Delete Selected Layer</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onDeleteHiddenLayers}
              >
                <Minus className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Delete Hidden Layers</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Grouping / Smart Object Actions */}
        <div className="flex flex-wrap gap-1 justify-start">
          {hasMultipleSelection ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className={buttonSize}
                    variant="outline"
                    onClick={() => onCreateSmartObject(selectedLayerIds)}
                  >
                    <FileArchive className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Create Smart Object</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className={buttonSize}
                    variant="outline"
                    onClick={groupLayers}
                    disabled={selectedLayerIds.some(id => layers.find(l => l.id === id)?.type === 'image')}
                  >
                    <Group className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Group Layers</p></TooltipContent>
              </Tooltip>
            </>
          ) : isSmartObject ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className={buttonSize}
                    variant="outline"
                    onClick={() => selectedLayer.id && onOpenSmartObject(selectedLayer.id)}
                  >
                    <FileArchive className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Smart Object Contents</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className={buttonSize}
                    variant="outline"
                    onClick={onConvertSmartObjectToLayers}
                  >
                    <Layers className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Convert to Layers</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className={buttonSize}
                    variant="outline"
                    onClick={onExportSmartObjectContents}
                  >
                    <Download className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Export Contents</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className={buttonSize}
                    variant="outline"
                    onClick={onRasterizeSmartObject}
                  >
                    <RotateCcw className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Rasterize Smart Object</p></TooltipContent>
              </Tooltip>
            </>
          ) : null}
        </div>

        {/* Masking / Clipping Actions */}
        <div className="flex flex-wrap gap-1 justify-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onApplySelectionAsMask}
                disabled={!hasActiveSelection || !isMaskable}
              >
                <SquareStack className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Apply Selection as Mask</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onInvertLayerMask}
                disabled={!hasMask}
              >
                <ArrowDownUp className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Invert Layer Mask</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant={isClipped ? "secondary" : "outline"}
                onClick={onToggleClippingMask}
                disabled={!isClippingMaskable}
              >
                <CornerUpLeft className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isClipped ? "Remove Clipping Mask" : "Create Clipping Mask"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};