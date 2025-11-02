import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { LayerItem } from './LayerItem'; // Use LayerItem for consistency
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Group, Type, PenTool, Square, Palette } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Layer } from '@/types/editor';
import { isGroupLayer } from '@/types/editor';
import { showError } from '@/utils/toast';

interface SmartObjectLayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  onAddLayer: (type: 'text' | 'drawing' | 'vector-shape' | 'gradient') => void;
  onDeleteLayer: (id: string) => void;
  onGroupLayers: () => void;
  toggleLayerVisibility: (id: string) => void;
  toggleGroupExpanded: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
}

// Recursive Layer List Component (Internal to SmartObjectLayersPanel)
const RecursiveLayerList: React.FC<{
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleGroupExpanded: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
}> = ({ layers, selectedLayerId, onSelectLayer, toggleLayerVisibility, toggleGroupExpanded, onToggleLayerLock, renameLayer }) => {
  const { active } = useDndContext();
  const activeId = active?.id;

  return (
    <div className="flex flex-col">
      <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {layers.map((layer) => (
          <React.Fragment key={layer.id}>
            <LayerItem
              layer={layer}
              isSelected={selectedLayerId === layer.id}
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


const SmartObjectLayersPanel: React.FC<SmartObjectLayersPanelProps> = ({ layers, selectedLayerId, onSelectLayer, onReorder, onAddLayer, onDeleteLayer, onGroupLayers, toggleLayerVisibility, toggleGroupExpanded, onToggleLayerLock, renameLayer }) => {
  const { active } = useDndContext();
  const activeId = active?.id;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-[150px]">
        <div className="p-2">
          <RecursiveLayerList
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id, ctrlKey, shiftKey) => onSelectLayer(id, ctrlKey, shiftKey)}
            toggleLayerVisibility={toggleLayerVisibility}
            toggleGroupExpanded={toggleGroupExpanded}
            onToggleLayerLock={onToggleLayerLock}
            renameLayer={renameLayer}
          />
        </div>
      </ScrollArea>
      
      <div className="flex justify-between p-2 border-t">
        <TooltipProvider>
          <div className="flex space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAddLayer('text')}>
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Text Layer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAddLayer('drawing')}>
                  <PenTool className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Drawing Layer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAddLayer('vector-shape')}>
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Shape Layer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAddLayer('gradient')}>
                  <Palette className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Gradient Layer</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-8" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onGroupLayers}>
                  <Group className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Group Layers</TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onDeleteLayer(selectedLayerId!)} disabled={!selectedLayerId || selectedLayerId === 'background'}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Layer</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SmartObjectLayersPanel;