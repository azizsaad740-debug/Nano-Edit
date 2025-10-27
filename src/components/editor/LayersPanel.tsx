import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Plus, Trash2, Square, Scissors, Package } from 'lucide-react';
import LayerItem from './LayerItem';
import LayerControls from './LayerControls';
import { Layer } from '@/types/editor'; // Import Layer type
import { showError } from '@/utils/toast'; // Import showError

// Define Props based on Sidebar usage error (Fixes Error 2 component signature)
interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void; // Delete handler (needs selected ID)
  onAddDrawingLayer: () => string; // Generic add layer
  onApplySelectionAsMask: () => void; // Add Mask
  onCreateSmartObject: (layerIds: string[]) => void; // Convert to Smart Object
  onToggleClippingMask: (id: string) => void; // Create Clipping Mask
  
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  hasActiveSelection: boolean;
  
  // Other props needed by LayerItem/LayerList (assuming LayerList is used later)
  [key: string]: any; 
}

// Mock data for layers (kept for fallback/initial render)
const mockLayers: Layer[] = [
  { id: '1', name: 'Background', visible: true, isLocked: false, type: 'image', opacity: 100, blendMode: 'Normal' },
  { id: '2', name: 'Text Layer', visible: true, isLocked: false, type: 'text', opacity: 100, blendMode: 'Normal' },
  { id: '3', name: 'Shape 1', visible: false, isLocked: true, type: 'vector-shape', opacity: 100, blendMode: 'Normal' },
];

const LayersPanel: React.FC<LayersPanelProps> = ({ 
  layers, 
  onToggleVisibility, 
  onDelete, 
  onAddDrawingLayer, 
  onApplySelectionAsMask, 
  onCreateSmartObject, 
  onToggleClippingMask,
  selectedLayerId,
  selectedLayerIds,
  hasActiveSelection,
  ...rest // Capture other props like onRename, onSelectLayer, etc.
}) => {
  const layersToRender = layers && layers.length > 0 ? layers : mockLayers;
  
  const isAnyLayerSelected = selectedLayerId !== null;
  const isMultiSelected = selectedLayerIds.length > 1;
  
  const handleNewLayer = () => onAddDrawingLayer();
  
  const handleDeleteLayer = () => {
    if (selectedLayerId) {
      onDelete(selectedLayerId);
    } else {
      showError("Select a layer to delete.");
    }
  };
  
  const handleAddMask = () => {
    if (!isAnyLayerSelected) {
      showError("Select a layer to apply a mask.");
    } else if (!hasActiveSelection) {
      showError("Create an active selection first.");
    } else {
      onApplySelectionAsMask();
    }
  };
  
  const handleClippingMask = () => {
    if (!selectedLayerId) {
      showError("Select a layer to toggle clipping mask.");
    } else {
      onToggleClippingMask(selectedLayerId);
    }
  };
  
  const handleSmartObject = () => {
    if (isMultiSelected) {
      onCreateSmartObject(selectedLayerIds);
    } else {
      showError("Select multiple layers to create a Smart Object.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Layer Controls (Opacity/Blend Mode) */}
      <LayerControls />

      {/* Filter/Sort Bar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <Select defaultValue="kind">
          <SelectTrigger className="h-8 w-1/2 text-xs">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kind" className="text-xs">Kind</SelectItem>
            <SelectItem value="name" className="text-xs">Name</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-1/2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search" className="h-8 pl-7 text-xs" />
        </div>
      </div>

      {/* Layer List (Currently using mock data and simple LayerItem) */}
      <ScrollArea className="flex-grow">
        <div className="p-1 space-y-1">
          {/* NOTE: This should eventually use LayerList and SortableContext */}
          {layersToRender.map(layer => (
            <LayerItem 
              key={layer.id} 
              layer={layer} 
              onToggleVisibility={onToggleVisibility}
              isSelected={selectedLayerId === layer.id}
              // Placeholder props for LayerItem to avoid errors
              isEditing={false}
              tempName={layer.name}
              setTempName={() => {}}
              startRename={() => {}}
              confirmRename={() => {}}
              cancelRename={() => {}}
              onSelect={() => {}}
              onRemoveMask={() => {}}
              onToggleLock={() => {}}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Layer Action Bar (Restored functionality) */}
      <div className="flex justify-between items-center p-2 border-t bg-gray-50 dark:bg-gray-800">
        {/* Left side: New Layer, Delete */}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" title="New Layer (Drawing)" className="h-7 w-7" onClick={handleNewLayer}>
            <Plus size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Delete Selected Layer" 
            className="h-7 w-7" 
            onClick={handleDeleteLayer}
            disabled={!selectedLayerId || layers.find(l => l.id === selectedLayerId)?.type === 'image'}
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Right side: Masking, Smart Object, Clipping Mask */}
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            title="Apply Selection as Mask" 
            className="h-7 w-7" 
            onClick={handleAddMask}
            disabled={!isAnyLayerSelected || !hasActiveSelection || layers.find(l => l.id === selectedLayerId)?.type === 'image'}
          >
            <Square size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Toggle Clipping Mask" 
            className="h-7 w-7" 
            onClick={handleClippingMask}
            disabled={!isAnyLayerSelected || layers.findIndex(l => l.id === selectedLayerId) === 0}
          >
            <Scissors size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Convert to Smart Object" 
            className="h-7 w-7" 
            onClick={handleSmartObject}
            disabled={!isMultiSelected}
          >
            <Package size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;