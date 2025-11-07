"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Settings, Save, X, Type, PenTool, Square, Palette, Group, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { rasterizeLayersToDataUrl } from "@/utils/layerUtils";
import type { Layer, SmartObjectLayerData, Dimensions, TextLayerData, DrawingLayerData, VectorShapeLayerData, GradientLayerData, EditState, ActiveTool, Point, GradientToolState, ShapeType } from "@/types/editor";
import { isGroupLayer, isTextLayer, isDrawingLayer, isVectorShapeLayer, isGradientLayer } from "@/types/editor";
import SmartObjectLayersPanel from "./SmartObjectLayersPanel";
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import { SmartObjectPropertiesPanel } from "./SmartObjectPropertiesPanel";
import type { GradientPreset } from "@/hooks/useGradientPresets";

interface SmartObjectEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smartObjectLayer: SmartObjectLayerData;
  currentEditState: EditState;
  foregroundColor: string;
  backgroundColor: string;
  systemFonts: string[];
  customFonts: string[];
  gradientToolState: GradientToolState;
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  onSaveAndClose: (rasterizedDataUrl: string, layers: Layer[]) => void;
  onOpenFontManager: () => void;
}

export const SmartObjectEditor: React.FC<SmartObjectEditorProps> = ({
  open,
  onOpenChange,
  smartObjectLayer,
  currentEditState,
  foregroundColor,
  backgroundColor,
  systemFonts,
  customFonts,
  gradientToolState,
  gradientPresets,
  onSaveGradientPreset,
  onDeleteGradientPreset,
  onSaveAndClose,
  onOpenFontManager,
}) => {
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const [internalLayers, setInternalLayers] = React.useState<Layer[]>(smartObjectLayer.smartObjectData.layers);
  const [internalSelectedLayerId, setInternalSelectedLayerId] = React.useState<string | null>(null);
  const [internalZoom, setInternalZoom] = React.useState(1);
  const [internalActiveTool, setInternalActiveTool] = React.useState<ActiveTool | null>('move');

  const internalSelectedLayer = React.useMemo(() => internalLayers.find(l => l.id === internalSelectedLayerId), [internalLayers, internalSelectedLayerId]);
  
  const internalDimensions: Dimensions | null = React.useMemo(() => {
    const { width, height } = smartObjectLayer.smartObjectData;
    return (width && height) ? { width, height } : null;
  }, [smartObjectLayer.smartObjectData]);

  // Sync layers when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setInternalLayers(smartObjectLayer.smartObjectData.layers);
      setInternalSelectedLayerId(null);
      setInternalZoom(1);
    }
  }, [open, smartObjectLayer.smartObjectData.layers]);

  // --- Internal Layer Management ---

  const updateInternalLayer = React.useCallback((id: string, updates: Partial<Layer>) => {
    setInternalLayers(prevLayers => {
      const updateRecursive = (currentLayers: Layer[]): Layer[] => {
        return currentLayers.map(layer => {
          if (layer.id === id) {
            return { ...layer, ...updates } as Layer;
          }
          if (isGroupLayer(layer) && layer.children) {
            // FIX: Removed redundant id and updates arguments, relying on closure scope
            return { ...layer, children: updateRecursive(layer.children) } as Layer;
          }
          return layer;
        });
      };
      return updateRecursive(prevLayers);
    });
  }, []);

  const deleteInternalLayer = React.useCallback((id: string) => {
    setInternalLayers(prev => prev.filter(l => l.id !== id));
    setInternalSelectedLayerId(null);
  }, []);

  const renameInternalLayer = React.useCallback((id: string, newName: string) => {
    updateInternalLayer(id, { name: newName });
  }, [updateInternalLayer]);

  const toggleInternalLayerVisibility = React.useCallback((id: string) => {
    const layer = internalLayers.find(l => l.id === id);
    if (layer) {
      updateInternalLayer(id, { visible: !layer.visible });
    }
  }, [internalLayers, updateInternalLayer]);
  
  const toggleInternalGroupExpanded = React.useCallback((id: string) => {
    const layer = internalLayers.find(l => l.id === id);
    if (isGroupLayer(layer)) {
      updateInternalLayer(id, { isExpanded: !layer.isExpanded });
    }
  }, [internalLayers, updateInternalLayer]);
  
  const onToggleInternalLayerLock = React.useCallback((id: string) => {
    const layer = internalLayers.find(l => l.id === id);
    if (layer) {
      updateInternalLayer(id, { isLocked: !layer.isLocked });
    }
  }, [internalLayers, updateInternalLayer]);

  // --- Internal Layer Creation Logic ---

  const createBaseLayer = (type: Layer['type'], name: string, position: { x: number; y: number } = { x: 50, y: 50 }, initialWidth: number = 10, initialHeight: number = 10): Omit<Layer, 'type'> => ({
    id: uuidv4(),
    name,
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isLocked: false,
    maskDataUrl: null,
    isClippingMask: false,
    x: position.x, y: position.y, width: initialWidth, height: initialHeight, rotation: 0, scaleX: 1, scaleY: 1,
  });

  const addTextLayer = () => {
    const newLayer: TextLayerData = {
      ...createBaseLayer('text', 'Text Layer', { x: 50, y: 50 }, 50, 10),
      type: 'text',
      content: 'New Text Layer',
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
      ...createBaseLayer('drawing', 'Drawing Layer', { x: 50, y: 50 }, 100, 100),
      type: 'drawing',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 transparent pixel
      width: 100, height: 100,
    };
    setInternalLayers(prev => [newLayer, ...prev]);
    setInternalSelectedLayerId(newLayer.id);
    showSuccess(`Added Drawing Layer.`);
  };

  const addShapeLayer = (shapeType: ShapeType = 'rect') => {
    const newLayer: VectorShapeLayerData = {
      ...createBaseLayer('vector-shape', `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`, { x: 50, y: 50 }, 20, 20),
      type: 'vector-shape',
      shapeType: shapeType,
      fillColor: foregroundColor,
      strokeColor: backgroundColor,
      strokeWidth: 2,
      borderRadius: shapeType === 'rect' ? 5 : 0,
    };
    setInternalLayers(prev => [newLayer, ...prev]);
    setInternalSelectedLayerId(newLayer.id);
    showSuccess(`Added Shape Layer.`);
  };

  const addGradientLayer = () => {
    const newLayer: GradientLayerData = {
      ...createBaseLayer('gradient', 'Gradient Layer', { x: 50, y: 50 }, 100, 100),
      type: 'gradient',
      gradientType: gradientToolState.type === 'radial' ? 'radial' : 'linear',
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
  
  // --- Save Logic ---
  
  const handleSaveAndClose = async () => {
    if (!internalDimensions) {
      showError("Cannot save: Smart Object dimensions are undefined.");
      return;
    }

    const toastId = showLoading("Rasterizing Smart Object contents...");
    try {
      // 1. Rasterize internal layers to a single data URL
      const rasterizedDataUrl = await rasterizeLayersToDataUrl(
        internalLayers,
        internalDimensions,
        currentEditState // Pass the global edit state for filters/adjustments
      );

      // 2. Pass the result back to the main editor
      onSaveAndClose(rasterizedDataUrl, internalLayers);
      
      dismissToast(toastId);
      showSuccess("Smart Object saved and updated.");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving Smart Object:", error);
      dismissToast(toastId);
      showError("Failed to save Smart Object contents.");
    }
  };

  // --- DND Handlers ---

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    const oldIndex = internalLayers.findIndex(l => l.id === active.id);
    const newIndex = internalLayers.findIndex(l => l.id === over?.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      setInternalLayers(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  // --- Render ---

  if (!internalDimensions) return null;

  const workspaceStyle: React.CSSProperties = {
    width: `${internalDimensions.width}px`,
    height: `${internalDimensions.height}px`,
    transform: `scale(${internalZoom})`,
    transformOrigin: 'top left',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" /> Editing Smart Object: {smartObjectLayer.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInternalZoom(z => Math.min(5, z + 0.1))}>Zoom In</Button>
            <Button variant="outline" size="sm" onClick={() => setInternalZoom(z => Math.max(0.1, z - 0.1))}>Zoom Out</Button>
            <Button onClick={handleSaveAndClose} size="sm">
              <Save className="h-4 w-4 mr-2" /> Save & Close
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Panel: Layers */}
          <div className="w-64 border-r flex flex-col shrink-0">
            <h3 className="text-sm font-medium p-2 border-b">Layers</h3>
            <SmartObjectLayersPanel
              layers={internalLayers}
              selectedLayerId={internalSelectedLayerId}
              onSelectLayer={(id) => setInternalSelectedLayerId(id)}
              onAddLayer={(type) => {
                if (type === 'text') addTextLayer();
                if (type === 'drawing') addDrawingLayer();
                if (type === 'vector-shape') addShapeLayer();
                if (type === 'gradient') addGradientLayer();
              }}
              onDeleteLayer={deleteInternalLayer}
              onGroupLayers={() => showError("Grouping is a stub.")}
              toggleLayerVisibility={toggleInternalLayerVisibility}
              toggleGroupExpanded={toggleInternalGroupExpanded}
              onToggleLayerLock={onToggleInternalLayerLock}
              renameLayer={renameInternalLayer}
            />
          </div>

          {/* Center Panel: Workspace */}
          <div className="flex-1 relative overflow-hidden bg-muted/50" ref={workspaceRef}>
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xl bg-background border border-border overflow-hidden"
              style={workspaceStyle}
            >
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SmartObjectWorkspace
                  layers={internalLayers}
                  parentDimensions={internalDimensions}
                  containerRef={workspaceRef}
                  onUpdate={updateInternalLayer}
                  onCommit={(id) => console.log(`SO Internal Layer ${id} committed.`)} // No history needed internally
                  selectedLayerId={internalSelectedLayerId}
                  activeTool={internalActiveTool}
                  globalSelectedLayerId={internalSelectedLayerId}
                  zoom={internalZoom}
                  setSelectedLayerId={setInternalSelectedLayerId}
                />
              </DndContext>
            </div>
          </div>

          {/* Right Panel: Properties */}
          <div className="w-72 border-l flex flex-col shrink-0">
            <h3 className="text-sm font-medium p-2 border-b">Properties</h3>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {internalSelectedLayer ? (
                  <SmartObjectPropertiesPanel
                    selectedLayer={internalSelectedLayer}
                    onLayerUpdate={updateInternalLayer}
                    onLayerCommit={(id, name) => console.log(`SO Internal Layer ${id} committed: ${name}`)}
                    systemFonts={systemFonts}
                    customFonts={customFonts}
                    onOpenFontManager={onOpenFontManager}
                    gradientToolState={gradientToolState}
                    gradientPresets={gradientPresets}
                    onSaveGradientPreset={onSaveGradientPreset}
                    onDeleteGradientPreset={onDeleteGradientPreset}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Select a layer to view properties.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};