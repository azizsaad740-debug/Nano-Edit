import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import SmartLayerItem from './SmartLayerItem';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Group } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Layer } from '@/types/editor';
import { isGroupLayer } from '@/types/editor';

interface SmartObjectLayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onAddLayer: (type: 'text' | 'drawing' | 'vector-shape' | 'gradient') => void;
  onDeleteLayer: (id: string) => void;
  onGroupLayers: () => void;
  toggleLayerVisibility: (id: string) => void;
  toggleGroupExpanded: (id: string) => void;
}

const SmartObjectLayersPanel: React.FC<SmartObjectLayersPanelProps> = ({ layers, selectedLayerId, onSelectLayer, onReorder, onAddLayer, onDeleteLayer, onGroupLayers, toggleLayerVisibility, toggleGroupExpanded }) => {
  const { active } = useDndContext();
  const activeId = active?.id;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {layers.map((layer) => (
              <React.Fragment key={layer.id}>
                <SmartLayerItem
                  layer={layer}
                  isSelected={selectedLayerId === layer.id}
                  onSelect={onSelectLayer}
                  toggleVisibility={toggleLayerVisibility}
                  toggleGroupExpanded={toggleGroupExpanded}
                  isDragging={activeId === layer.id}
                />
                {isGroupLayer(layer) && layer.isExpanded && layer.children && (
                  <div className="ml-4 border-l border-muted">
                    <SmartObjectLayersPanel
                      layers={layer.children}
                      selectedLayerId={selectedLayerId}
                      onSelectLayer={onSelectLayer}
                      onReorder={onReorder}
                      onAddLayer={onAddLayer}
                      onDeleteLayer={onDeleteLayer}
                      onGroupLayers={onGroupLayers}
                      toggleLayerVisibility={toggleLayerVisibility}
                      toggleGroupExpanded={toggleGroupExpanded}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </SortableContext>
      </div>
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