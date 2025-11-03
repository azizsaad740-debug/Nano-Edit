import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import type { Layer, ActiveTool, ShapeType, Dimensions, GradientToolState, Point, TextLayerData, DrawingLayerData, VectorShapeLayerData, GradientLayerData } from "@/types/editor";
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import SmartObjectLayersPanel from "./SmartObjectLayersPanel";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { showError, showSuccess } from "@/utils/toast";
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import { v4 as uuidv4 } from 'uuid';

interface SmartObjectEditorProps {
  layerId: string;
  onClose: () => void;
  onSave: (id: string, name: string) => void;
  layers: Layer[]; // Global layers
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  recordHistory: (name: string, state: any, layers: Layer[]) => void;
  currentEditState: any;
  dimensions: Dimensions | null;
  foregroundColor: string;
  backgroundColor: string;
  gradientToolState: GradientToolState;
  selectedShapeType: ShapeType | null;
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null;
  clearSelectionState: () => void;
  setImage: (image: string | null) => void;
  setFileInfo: (info: { name: string; size: number } | null) => void;
  setSelectedLayerId: (id: string | null) => void;
  selectedLayerId: string | null;
}

export const SmartObjectEditor: React.FC<SmartObjectEditorProps> = ({
  layerId,
  onClose,
  onSave,
  layers: globalLayers,
  updateLayer: updateGlobalLayer,
  recordHistory,
  currentEditState,
  dimensions,
  foregroundColor,
  backgroundColor,
  gradientToolState,
  selectedShapeType,
  selectionPath,
  selectionMaskDataUrl,
  clearSelectionState,
  setImage,
  setFileInfo,
  setSelectedLayerId,
  selectedLayerId: globalSelectedLayerId,
}) => {
  const smartObjectLayer = globalLayers.find(l => l.id === layerId);
  const [internalLayers, setInternalLayers] = React.useState<Layer[]>(smartObjectLayer?.type === 'smart-object' ? smartObjectLayer.smartObjectData.layers : []);
  const [internalSelectedLayerId, setInternalSelectedLayerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (smartObjectLayer?.type === 'smart-object') {
      setInternalLayers(smartObjectLayer.smartObjectData.layers);
    }
  }, [smartObjectLayer]);

  const handleSave = () => {
    if (smartObjectLayer?.type === 'smart-object') {
      updateGlobalLayer(layerId, {
        smartObjectData: {
          ...smartObjectLayer.smartObjectData,
          layers: internalLayers,
        }
      });
      onSave(layerId, `Edit Smart Object: ${smartObjectLayer.name}`);
    }
    onClose();
  };

  // --- Internal Layer Creation Logic ---
  
  const createBaseLayer = (type: Layer['type'], name: string): Omit<Layer, 'type'> => ({
    id: uuidv4(),
    name,
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isLocked: false,
    maskDataUrl: null,
    isClippingMask: false,
    x: 50, y: 50, width: 50, height: 10, rotation: 0, scaleX: 1, scaleY: 1,
  });

  const addTextLayer = () => {
    const newLayer: TextLayerData = {
      ...createBaseLayer('text', 'Text Layer'),
      type: 'text',
      content: 'New Text',
      fontSize: 48,
      color: foregroundColor,
      fontFamily: 'Roboto',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      padding: 0,
      width: 50, height: 10,
    };
    setInternalLayers(prev => [newLayer, ...prev]);
    setInternalSelectedLayerId(newLayer.id);
    showSuccess(`Added Text Layer.`);
  };

  const addDrawingLayer = () => {
    const newLayer: DrawingLayerData = {
      ...createBaseLayer('drawing', 'Drawing Layer'),
      type: 'drawing',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 transparent pixel
      width: 100, height: 100,
    };
    setInternalLayers(prev => [newLayer, ...prev]);
    setInternalSelectedLayerId(newLayer.id);
    showSuccess(`Added Drawing Layer.`);
  };

  const addShapeLayer = () => {
    const newLayer: VectorShapeLayerData = {
      ...createBaseLayer('vector-shape', 'Shape Layer'),
      type: 'vector-shape',
      shapeType: selectedShapeType || 'rect',
      fillColor: foregroundColor,
      strokeColor: backgroundColor,
      strokeWidth: 0,
      borderRadius: 0,
      width: 10, height: 10,
    };
    setInternalLayers(prev => [newLayer, ...prev]);
    setInternalSelectedLayerId(newLayer.id);
    showSuccess(`Added Shape Layer.`);
  };

  const addGradientLayer = () => {
    const newLayer: GradientLayerData = {
      ...createBaseLayer('gradient', 'Gradient Layer'),
      type: 'gradient',
      gradientType: gradientToolState.type,
      gradientColors: gradientToolState.colors,
      stops: gradientToolState.stops,
      gradientAngle: gradientToolState.angle,
      gradientFeather: gradientToolState.feather,
      gradientInverted: gradientToolState.inverted,
      gradientCenterX: gradientToolState.centerX,
      gradientCenterY: gradientToolState.centerY,
      gradientRadius: gradientToolState.radius,
      width: 100, height: 100,
    };
    setInternalLayers(prev => [newLayer, ...prev]);
    setInternalSelectedLayerId(newLayer.id);
    showSuccess(`Added Gradient Layer.`);
  };
  
  const handleAddLayer = (type: 'text' | 'drawing' | 'vector-shape' | 'gradient') => {
    if (type === 'text') addTextLayer();
    if (type === 'drawing') addDrawingLayer();
    if (type === 'vector-shape') addShapeLayer();
    if (type === 'gradient') addGradientLayer();
  };
  // --- End Internal Layer Creation Logic ---

  const handleDeleteLayer = (id: string) => {
    setInternalLayers(prev => prev.filter(l => l.id !== id));
    setInternalSelectedLayerId(null);
  };

  const handleReorder = (activeId: string, overId: string) => {
    const oldIndex = internalLayers.findIndex(l => l.id === activeId);
    const newIndex = internalLayers.findIndex(l => l.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    setInternalLayers(prev => arrayMove(prev, oldIndex, newIndex));
  };

  const handleUpdateInternalLayer = (id: string, updates: Partial<Layer>) => {
    setInternalLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } as Layer : l)); // Fixed type casting issue
  };
  
  const handleCommitInternalLayer = (id: string) => {
    // No history recording inside SO editor, commit happens on save
  };
  
  const handleToggleVisibility = (id: string) => {
    setInternalLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };
  
  const handleToggleLock = (id: string) => {
    setInternalLayers(prev => prev.map(l => l.id === id ? { ...l, isLocked: !l.isLocked } : l));
  };
  
  const handleRenameLayer = (id: string, newName: string) => {
    setInternalLayers(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
  };
  
  const handleToggleGroupExpanded = (id: string) => {
    setInternalLayers(prev => prev.map(l => l.id === id && l.type === 'group' ? { ...l, isExpanded: !l.isExpanded } : l) as Layer[]);
  };
  
  const handleGroupLayers = () => showError("Grouping inside Smart Object is a stub.");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (smartObjectLayer?.type !== 'smart-object') {
    return <div className="p-4">Error: Not a valid Smart Object layer.</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleReorder(e.active.id as string, e.over?.id as string)}>
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col">
        <header className="flex items-center justify-between h-12 px-4 border-b">
          <h2 className="text-lg font-semibold">Editing Smart Object: {smartObjectLayer.name}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Save & Close
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Left Panel: Tools (Stub) */}
          <div className="w-16 border-r p-2">
            <p className="text-xs text-muted-foreground text-center">Tools</p>
            {/* Placeholder for tools panel */}
          </div>

          {/* Center Panel: Workspace */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-muted/50">
            <div
              className="relative shadow-xl bg-background border border-border"
              style={{ width: '80%', height: '80%', maxWidth: '1000px', maxHeight: '800px' }}
            >
              <SmartObjectWorkspace
                layers={internalLayers}
                parentDimensions={dimensions}
                containerRef={React.useRef(null)} // Stub container ref
                onUpdate={handleUpdateInternalLayer}
                onCommit={handleCommitInternalLayer}
                selectedLayerId={internalSelectedLayerId}
                activeTool={null} // Tools disabled in SO editor stub
                globalSelectedLayerId={globalSelectedLayerId}
                zoom={1}
                setSelectedLayerId={setInternalSelectedLayerId}
              />
            </div>
          </div>

          {/* Right Panel: Layers */}
          <div className="w-64 border-l flex flex-col">
            <h3 className="text-sm font-semibold p-3 border-b">Internal Layers</h3>
            <ScrollArea className="flex-1">
              <SmartObjectLayersPanel
                layers={internalLayers}
                selectedLayerId={internalSelectedLayerId}
                onSelectLayer={(id) => setInternalSelectedLayerId(id)}
                onReorder={handleReorder}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
                onGroupLayers={handleGroupLayers}
                toggleLayerVisibility={handleToggleVisibility}
                toggleGroupExpanded={handleToggleGroupExpanded}
                onToggleLayerLock={handleToggleLock}
                renameLayer={handleRenameLayer}
              />
            </ScrollArea>
          </div>
        </div>
      </div>
    </DndContext>
  );
};