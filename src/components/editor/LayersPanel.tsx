import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Group, Layers, Zap, Image, Type, PenTool, Square, Palette, Folder, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Layer, Point, ShapeType } from "@/types/editor";
import { LayerItem } from "./LayerItem";
import { LayerControls } from "./LayerControls";
import { LayerActions } from "./LayerActions";
import { useDndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { isGroupLayer } from '@/types/editor';
import { showError } from '@/utils/toast';

// Define props interface
interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  selectedLayer: Layer | undefined;
  selectedLayerIds: string[]; // NEW
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onReorder: (activeId: string, overId: string) => void; // CORRECTED SIGNATURE
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  deleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeLayerDown: (id: string) => void;
  onRasterizeLayer: (id: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  addTextLayer: (coords: Point, color: string) => void;
  addDrawingLayer: (coords: Point, dataUrl: string) => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  addShapeLayer: (coords: Point, shapeType?: ShapeType, initialWidth?: number, initialHeight?: number, fillColor?: string, strokeColor?: string) => void;
  addGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  selectedShapeType: ShapeType | null;
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: (id: string) => void;
  onConvertSmartObjectToLayers: (id: string) => void;
  onExportSmartObjectContents: (id: string) => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  handleDestructiveOperation: (operation: 'delete' | 'fill') => void;
  foregroundColor: string;
}

// Recursive Layer List Component (Internal to LayersPanel)
const RecursiveLayerList: React.FC<{
  layers: Layer[];
  selectedLayerId: string | null;
  selectedLayerIds: string[]; // NEW
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleGroupExpanded: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
}> = ({ layers, selectedLayerId, selectedLayerIds, onSelectLayer, toggleLayerVisibility, toggleGroupExpanded, onToggleLayerLock, renameLayer }) => {
  const { active } = useDndContext();
  const activeId = active?.id;

  return (
    <div className="flex flex-col">
      <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {layers.map((layer) => (
          <React.Fragment key={layer.id}>
            <LayerItem
              layer={layer}
              isSelected={selectedLayerIds.includes(layer.id)} // Use selectedLayerIds for highlighting
              onSelect={onSelectLayer}
              toggleVisibility={toggleLayerVisibility}
              toggleGroupExpanded={toggleGroupExpanded}
              onToggleLayerLock={onToggleLayerLock}
              renameLayer={renameLayer}
              isDragging={activeId === layer.id}
            />
            {isGroupLayer(layer) && layer.isExpanded && layer.children && (
              <div className="ml-4 border-l border-muted">
                <RecursiveLayerList
                  layers={layer.children}
                  selectedLayerId={selectedLayerId}
                  selectedLayerIds={selectedLayerIds} // Pass down
                  onSelectLayer={onSelectLayer}
                  toggleLayerVisibility={toggleLayerVisibility}
                  toggleGroupExpanded={toggleGroupExpanded}
                  onToggleLayerLock={onToggleLayerLock}
                  renameLayer={renameLayer}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </SortableContext>
    </div>
  );
};


export const LayersPanel: React.FC<LayersPanelProps> = (props) => {
  const {
    layers, selectedLayerId, selectedLayer, onSelectLayer, selectedLayerIds,
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer, onAddAdjustmentLayer,
    selectedShapeType, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    foregroundColor,
  } = props;

  const handleAddLayer = (type: 'text' | 'drawing' | 'vector-shape' | 'gradient' | 'adjustment') => {
    if (type === 'text') {
      addTextLayer({ x: 50, y: 50 }, foregroundColor);
    } else if (type === 'drawing') {
      // Drawing layer creation is handled by the brush tool interaction, this is a stub for a blank layer
      showError("Adding a blank drawing layer is a stub. Use a brush tool to start drawing.");
    } else if (type === 'vector-shape') {
      addShapeLayer({ x: 50, y: 50 }, selectedShapeType || 'rect');
    } else if (type === 'gradient') {
      addGradientLayer();
    } else if (type === 'adjustment') {
      onAddAdjustmentLayer('brightness'); // Default adjustment layer
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Layer Controls (Opacity/Blend Mode) */}
      <div className="p-2 border-b">
        <LayerControls
          selectedLayer={selectedLayer}
          onLayerPropertyCommit={(updates, name) => selectedLayer && props.onLayerPropertyCommit(selectedLayer.id, updates, name)}
          onLayerOpacityChange={props.onLayerOpacityChange}
          onLayerOpacityCommit={props.onLayerOpacityCommit}
        />
      </div>

      {/* Layer List */}
      <ScrollArea className="flex-1 min-h-[150px]">
        <div className="p-2">
          <RecursiveLayerList
            layers={layers}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds} // PASSED
            onSelectLayer={onSelectLayer}
            toggleLayerVisibility={toggleLayerVisibility}
            toggleGroupExpanded={toggleGroupExpanded}
            onToggleLayerLock={onToggleLayerLock}
            renameLayer={renameLayer}
          />
        </div>
      </ScrollArea>

      {/* Layer Actions */}
      <div className="p-2 border-t">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium">New Layer</h4>
          <div className="flex space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddLayer('text')}>
                    <Type className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Text Layer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddLayer('vector-shape')}>
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Shape Layer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddLayer('gradient')}>
                    <Palette className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Gradient Layer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddLayer('adjustment')}>
                    <Zap className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Adjustment Layer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLayerFromSelection} disabled={!hasActiveSelection}>
                    <Layers className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Layer via Copy/Cut</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <LayerActions
          layers={layers}
          selectedLayer={selectedLayer}
          selectedLayerIds={selectedLayerIds} // PASSED
          onAddTextLayer={() => handleAddLayer('text')}
          onAddDrawingLayer={() => handleAddLayer('drawing')}
          onAddShapeLayer={(coords, shapeType) => addShapeLayer(coords, shapeType)}
          onAddGradientLayer={() => handleAddLayer('gradient')}
          onDeleteLayer={() => selectedLayerId && deleteLayer(selectedLayerId)}
          onDuplicateLayer={() => selectedLayerId && onDuplicateLayer(selectedLayerId)}
          onMergeLayerDown={() => selectedLayerId && onMergeLayerDown(selectedLayerId)}
          onRasterizeLayer={() => selectedLayerId && onRasterizeLayer(selectedLayerId)}
          onCreateSmartObject={(ids) => onCreateSmartObject(ids)}
          onOpenSmartObject={onOpenSmartObject}
          selectedShapeType={selectedShapeType}
          groupLayers={() => selectedLayerId && groupLayers([selectedLayerId])} // Simplified for single selection
          hasActiveSelection={hasActiveSelection}
          onApplySelectionAsMask={onApplySelectionAsMask}
          onInvertLayerMask={() => selectedLayerId && onInvertLayerMask(selectedLayerId)}
          onToggleClippingMask={() => selectedLayerId && onToggleClippingMask(selectedLayerId)}
          onDeleteHiddenLayers={onDeleteHiddenLayers}
          onRasterizeSmartObject={() => selectedLayerId && onRasterizeSmartObject(selectedLayerId)}
          onConvertSmartObjectToLayers={() => selectedLayerId && onConvertSmartObjectToLayers(selectedLayerId)}
          onExportSmartObjectContents={() => selectedLayerId && onExportSmartObjectContents(selectedLayerId)}
          onArrangeLayer={onArrangeLayer}
        />
      </div>
    </div>
  );
};