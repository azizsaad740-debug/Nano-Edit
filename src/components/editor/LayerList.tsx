"use client";

import * as React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Layer } from "@/hooks/useEditorState";
import LayerItem from "./LayerItem";

interface LayerListProps {
  layersToRender: Layer[];
  depth: number;
  editingId: string | null;
  tempName: string;
  setTempName: (name: string) => void;
  startRename: (layer: Layer) => void;
  confirmRename: (id: string) => void;
  cancelRename: () => void;
  onToggleVisibility: (id: string) => void;
  selectedLayerIds: string[];
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onToggleGroupExpanded: (id: string) => void;
  onRemoveLayerMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
}

// Recursive component to render the layer tree
const LayerList: React.FC<LayerListProps> = ({
  layersToRender,
  depth,
  editingId,
  tempName,
  setTempName,
  startRename,
  confirmRename,
  cancelRename,
  onToggleVisibility,
  selectedLayerIds,
  onSelectLayer,
  onToggleGroupExpanded,
  onRemoveLayerMask,
  onToggleLayerLock,
}) => {
  // Render layers in reverse order (bottom layer in array is rendered first/last in list)
  return (
    <>
      {layersToRender.slice().reverse().map((layer) => (
        <React.Fragment key={layer.id}>
          <LayerItem
            layer={layer}
            isEditing={editingId === layer.id}
            tempName={tempName}
            setTempName={setTempName}
            startRename={startRename}
            confirmRename={confirmRename}
            cancelRename={cancelRename}
            onToggleVisibility={onToggleVisibility}
            isSelected={selectedLayerIds.includes(layer.id)}
            onSelect={(e) => onSelectLayer(layer.id, e.ctrlKey || e.metaKey, e.shiftKey)}
            onToggleGroupExpanded={onToggleGroupExpanded}
            depth={depth}
            onRemoveMask={onRemoveLayerMask}
            onToggleLock={onToggleLayerLock}
          />
          {layer.type === 'group' && layer.expanded && layer.children && (
            <SortableContext
              items={layer.children.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <LayerList
                layersToRender={layer.children}
                depth={depth + 1}
                editingId={editingId}
                tempName={tempName}
                setTempName={setTempName}
                startRename={startRename}
                confirmRename={confirmRename}
                cancelRename={cancelRename}
                onToggleVisibility={onToggleVisibility}
                selectedLayerIds={selectedLayerIds}
                onSelectLayer={onSelectLayer}
                onToggleGroupExpanded={onToggleGroupExpanded}
                onRemoveLayerMask={onRemoveLayerMask}
                onToggleLayerLock={onToggleLayerLock}
              />
            </SortableContext>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default LayerList;