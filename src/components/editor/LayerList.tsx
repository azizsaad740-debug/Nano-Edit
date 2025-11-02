import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import LayerItem from './LayerItem';
import type { Layer, GroupLayerData } from '@/types/editor';
import { isGroupLayer } from '@/types/editor';

interface LayerListProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleGroupExpanded: (id: string) => void;
}

const LayerList: React.FC<LayerListProps> = ({ layers, selectedLayerId, onSelectLayer, onReorder, toggleLayerVisibility, toggleGroupExpanded }) => {
  const { active } = useDndContext();
  const activeId = active?.id;

  return (
    <div className="flex flex-col">
      {layers.map((layer) => (
        <React.Fragment key={layer.id}>
          <LayerItem
            layer={layer}
            isSelected={selectedLayerId === layer.id}
            onSelect={onSelectLayer}
            toggleVisibility={toggleLayerVisibility}
            toggleGroupExpanded={toggleGroupExpanded}
            isDragging={activeId === layer.id}
          />
          {layer.type === 'group' && (layer as GroupLayerData).isExpanded && (layer as GroupLayerData).children && ( // Fix 176-180
            <SortableContext // Fix 181
              items={(layer as GroupLayerData).children.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="ml-4 border-l border-muted">
                <LayerList
                  layers={(layer as GroupLayerData).children}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={onSelectLayer}
                  onReorder={onReorder}
                  toggleLayerVisibility={toggleLayerVisibility}
                  toggleGroupExpanded={toggleGroupExpanded}
                />
              </div>
            </SortableContext>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LayerList;