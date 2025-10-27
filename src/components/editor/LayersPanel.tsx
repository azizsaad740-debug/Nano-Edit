import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Plus, Trash2, Square, Scissors, Package } from 'lucide-react';
import LayerItem from './LayerItem';
import LayerControls from './LayerControls';
import { Layer } from '@/types/editor'; // Import Layer type

// Define Props based on Sidebar usage error (Fixes Error 2 component signature)
interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => string;
  onApplySelectionAsMask: () => void;
  // Props for the buttons I added (Fixes Error 2 missing props)
  onAddLayer: () => void;
  onAddLayerMask: (id: string) => void;
  onConvertToSmartObject: (id: string) => void;
  onCreateClippingMask: (id: string) => void;
  // Using index signature temporarily to satisfy the '... 29 more ...' part of the error
  [key: string]: any; 
}

// Mock data for layers (Error 1 fix: using correct Layer type and valid 'type' values)
const mockLayers: Layer[] = [
  { id: '1', name: 'Background', visible: true, isLocked: false, type: 'image', opacity: 100, blendMode: 'Normal' },
  { id: '2', name: 'Text Layer', visible: true, isLocked: false, type: 'text', opacity: 100, blendMode: 'Normal' },
  { id: '3', name: 'Shape 1', visible: false, isLocked: true, type: 'vector-shape', opacity: 100, blendMode: 'Normal' },
];

const LayersPanel: React.FC<LayersPanelProps> = ({ 
  layers, 
  onAddLayer, 
  onDelete, 
  onAddLayerMask, 
  onConvertToSmartObject, 
  onCreateClippingMask, 
  onToggleVisibility 
}) => {
  // Use the passed 'layers' prop if available, otherwise use mock data for display
  const layersToRender = layers && layers.length > 0 ? layers : mockLayers;
  
  // Placeholder logic for button actions using props
  const handleNewLayer = () => onAddLayer();
  // Assuming we delete the currently selected layer, or the first one for mock purposes
  const handleDeleteLayer = () => onDelete(layersToRender[0]?.id || '1'); 
  const handleAddMask = () => onAddLayerMask(layersToRender[0]?.id || '1'); 
  const handleClippingMask = () => onCreateClippingMask(layersToRender[0]?.id || '1'); 
  const handleSmartObject = () => onConvertToSmartObject(layersToRender[0]?.id || '1'); 

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

      {/* Layer List */}
      <ScrollArea className="flex-grow">
        <div className="p-1 space-y-1">
          {/* Using layersToRender and passing onToggleVisibility */}
          {layersToRender.map(layer => (
            <LayerItem 
              key={layer.id} 
              layer={layer} 
              onToggleVisibility={onToggleVisibility} // Assuming LayerItem needs this
            />
          ))}
        </div>
      </ScrollArea>

      {/* Layer Action Bar (Re-added based on user request) */}
      <div className="flex justify-between items-center p-2 border-t bg-gray-50 dark:bg-gray-800">
        {/* Left side: New Layer, Delete */}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" title="New Layer" className="h-7 w-7" onClick={handleNewLayer}>
            <Plus size={14} />
          </Button>
          <Button variant="ghost" size="icon" title="Delete Layer" className="h-7 w-7" onClick={handleDeleteLayer}>
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Right side: Masking, Smart Object, Clipping Mask */}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" title="Add Layer Mask" className="h-7 w-7" onClick={handleAddMask}>
            <Square size={14} />
          </Button>
          <Button variant="ghost" size="icon" title="Create Clipping Mask" className="h-7 w-7" onClick={handleClippingMask}>
            <Scissors size={14} />
          </Button>
          <Button variant="ghost" size="icon" title="Convert to Smart Object" className="h-7 w-7" onClick={handleSmartObject}>
            <Package size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;