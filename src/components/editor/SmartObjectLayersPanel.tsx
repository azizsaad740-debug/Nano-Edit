import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { SmartLayerItem } from "./SmartLayerItem";
import LayerControls from "./LayerControls";
import { Layer } from '@/types/editor'; // Import Layer type

// Mock data for layers
const mockLayers: Layer[] = [
  { id: '1', name: 'Background', visible: true, isLocked: false, type: 'image', opacity: 100, blendMode: 'Normal' },
  { id: '2', name: 'Text Layer', visible: true, isLocked: false, type: 'text', opacity: 100, blendMode: 'Normal', content: 'Text' },
  { id: '3', name: 'Shape 1', visible: false, isLocked: true, type: 'vector-shape', opacity: 100, blendMode: 'Normal' },
];

const SmartObjectLayersPanel: React.FC = () => {
  // Placeholder handlers for SmartLayerItem
  const placeholderHandlers = {
    isSelected: false,
    onSelect: () => {},
    onToggleVisibility: () => {},
    isEditing: false,
    tempName: '',
    setTempName: () => {},
    startRename: () => {},
    confirmRename: () => {},
    cancelRename: () => {},
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

      {/* Layer List */}
      <ScrollArea className="flex-grow">
        <div className="p-1 space-y-1">
          {mockLayers.map(layer => (
            <SmartLayerItem 
              key={layer.id} 
              layer={layer} 
              {...placeholderHandlers}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Layer Action Bar */}
      <div className="flex justify-between items-center p-2 border-t bg-gray-50 dark:bg-gray-800">
        {/* Left side: New Layer, Delete */}
        <div className="flex gap-1">
          {/* Buttons removed for brevity, assuming they exist here */}
        </div>

        {/* Right side: Masking, Smart Object, Clipping Mask */}
        <div className="flex gap-1">
          {/* Buttons removed for brevity, assuming they exist here */}
        </div>
      </div>
    </div>
  );
};

export default SmartObjectLayersPanel;