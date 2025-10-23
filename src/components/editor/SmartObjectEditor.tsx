"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Move, Type, Layers, Copy, Merge, Trash2, Eye, EyeOff, Save, Undo2, Redo2, Minimize, Maximize, Palette, Square } from "lucide-react";
import type { Layer, ActiveTool, BrushState, GradientToolState } from "@/hooks/useEditorState";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { LayerProperties } from "./LayerProperties";
import TextProperties from "./TextProperties";
import ShapeProperties from "./ShapeProperties";
import GradientProperties from "./GradientProperties";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import { showError, showSuccess } from "@/utils/toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel";
import { useHotkeys } from "react-hotkeys-hook";
import { LayerControls } from "./LayerControls"; // Import LayerControls

interface SmartObjectEditorProps {
  smartObject: Layer;
  onClose: () => void;
  onSave: (updatedLayers: Layer[]) => void;
  mainImage: string | null;
  // Tool state passed from parent
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  selectedShapeType: Layer['shapeType'] | null;
  setSelectedShapeType: (type: Layer['shapeType'] | null) => void;
}

interface SmartLayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisibility: (id: string) => void;
}

const SmartLayerItem = ({ layer, isSelected, onSelect, onToggleVisibility }: SmartLayerItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const getLayerIcon = () => {
    switch (layer.type) {
      case 'text':
        return <Type className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'vector-shape':
        return <Square className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'gradient':
        return <Palette className="h-4 w-4 text-muted-foreground shrink-0" />;
      default:
        return <Layers className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between p-2 border rounded-md transition-shadow cursor-pointer bg-background",
        isDragging && "shadow-lg z-10 relative",
        isSelected && !isDragging && "bg-accent text-accent-foreground ring-2 ring-ring"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1"
        >
          <Move className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => handleIconClick(e, () => onToggleVisibility(layer.id))}
        >
          {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {getLayerIcon()}
        <span className="font-medium truncate">{layer.name}</span>
      </div>
    </div>
  );
};

export const SmartObjectEditor = ({ 
  smartObject, 
  onClose, 
  onSave, 
  mainImage, 
  activeTool,
  setActiveTool,
  brushState,
  setBrushState,
  foregroundColor,
  onForegroundColorChange,
  backgroundColor,
  onBackgroundColorChange,
  onSwapColors,
  selectedShapeType,
  setSelectedShapeType,
}: SmartObjectEditorProps) => {
  const [layers, setLayers] = React.useState<Layer[]>(smartObject.smartObjectData?.layers || []);
  const [selectedLayerId, setSelectedLayerId] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<Layer[][]>([smartObject.smartObjectData?.layers || []]);
  const [historyIndex, setHistoryIndex] = React.useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const recordHistory = React.useCallback((newLayers: Layer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newLayers]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  useHotkeys("ctrl+z, cmd+z", handleUndo, { preventDefault: true });
  useHotkeys("ctrl+y, cmd+shift+z", handleRedo, { preventDefault: true });

  const handleSave = () => {
    onSave(layers);
  };

  const handleLayerUpdate = React.useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const handleLayerCommit = React.useCallback((id: string) => {
    // Commit to local smart object history
    setLayers(prev => {
      recordHistory(prev);
      return prev;
    });
  }, [recordHistory]);

  const handleLayerOpacityChange = React.useCallback((opacity: number) => {
    if (selectedLayerId) {
      handleLayerUpdate(selectedLayerId, { opacity });
    }
  }, [selectedLayerId, handleLayerUpdate]);

  const handleLayerOpacityCommit = React.useCallback(() => {
    if (selectedLayerId) {
      handleLayerCommit(selectedLayerId);
    }
  }, [selectedLayerId, handleLayerCommit]);

  const handleLayerPropertyCommit = React.useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    setLayers(prev => {
      const updatedLayers = prev.map(l => (l.id === id ? { ...l, ...updates } : l));
      recordHistory(updatedLayers);
      return updatedLayers;
    });
  }, [recordHistory]);

  const handleAddTextLayer = () => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: 50,
      y: 50,
      fontSize: 48,
      color: "#000000",
      fontFamily: "Roboto",
      opacity: 100,
      blendMode: 'normal',
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      rotation: 0,
      letterSpacing: 0,
      padding: 10,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
  };

  const handleAddDrawingLayer = () => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: `Drawing ${layers.filter((l) => l.type === "drawing").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: "",
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  };

  const handleAddShapeLayer = () => {
    if (!selectedShapeType) {
      showError("Please select a shape type first.");
      return;
    }
    const newLayer: Layer = {
      id: uuidv4(),
      type: "vector-shape",
      name: `${selectedShapeType?.charAt(0).toUpperCase() + selectedShapeType?.slice(1) || 'Shape'} ${layers.filter((l) => l.type === "vector-shape").length + 1}`,
      visible: true,
      x: 50,
      y: 50,
      width: 10,
      height: 10,
      rotation: 0,
      opacity: 100,
      blendMode: 'normal',
      shapeType: selectedShapeType,
      fillColor: foregroundColor,
      strokeColor: backgroundColor,
      strokeWidth: 2,
      borderRadius: 0,
      points: selectedShapeType === 'triangle' ? [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}] : undefined,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
  };

  const handleAddGradientLayer = () => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "gradient",
      name: `Gradient ${layers.filter((l) => l.type === "gradient").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      gradientType: 'linear',
      gradientColors: [foregroundColor, backgroundColor],
      gradientStops: [0, 1],
      gradientAngle: 90,
      gradientFeather: 0,
      gradientInverted: false,
      gradientCenterX: 50,
      gradientCenterY: 50,
      gradientRadius: 50,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
  };

  const handleDeleteLayer = () => {
    if (!selectedLayerId) return;
    const updated = layers.filter(l => l.id !== selectedLayerId);
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(null);
  };

  const handleDuplicateLayer = () => {
    if (!selectedLayer) return;
    const newLayer: Layer = {
      ...selectedLayer,
      id: uuidv4(),
      name: `${selectedLayer.name} Copy`,
    };
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === selectedLayer.id);
      const updated = [...prev.slice(0, index + 1), newLayer, ...prev.slice(index + 1)];
      recordHistory(updated);
      return updated;
    });
    setSelectedLayerId(newLayer.id);
  };

  const handleMergeLayerDown = () => {
    showError("Merge Down is not supported in the isolated Smart Object Editor.");
  };

  const handleRasterizeLayer = () => {
    showError("Rasterize is not supported in the isolated Smart Object Editor.");
  };

  const handleToggleVisibility = (id: string) => {
    setLayers(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
      recordHistory(updated);
      return updated;
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = layers.findIndex((l) => l.id === active.id);
    const newIndex = layers.findIndex((l) => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    setLayers(prev => {
      const updated = arrayMove(prev, oldIndex, newIndex);
      recordHistory(updated);
      return updated;
    });
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard all changes to this Smart Object?")) {
      onClose();
    }
  };

  const smartObjectDimensions = smartObject.smartObjectData || { width: 1000, height: 1000 };

  // Dummy state for PropertiesPanel requirements (since we don't have full editor state here)
  const dummyGradientToolState: GradientToolState = { type: 'linear', colors: [], stops: [], angle: 0, centerX: 0, centerY: 0, radius: 0, feather: 0, inverted: false };
  const dummyPresets = [];
  const dummySetGradientToolState = () => {};
  const dummyOnSaveGradientPreset = () => {};
  const dummyOnDeleteGradientPreset = () => {};
  const dummySelectiveBlurStrength = 50;
  const dummyOnSelectiveBlurStrengthChange = () => {};
  const dummyOnSelectiveBlurStrengthCommit = () => {};

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="flex items-center justify-between h-16 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Edit Smart Object: {smartObject.name}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex === 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex === history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDiscard}>
            <X className="h-4 w-4 mr-2" />
            Discard Changes
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <ToolsPanel 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
          foregroundColor={foregroundColor} 
          onForegroundColorChange={onForegroundColorChange} 
          backgroundColor={backgroundColor} 
          onBackgroundColorChange={onBackgroundColorChange} 
          onSwapColors={onSwapColors} 
          brushState={brushState} 
          setBrushState={setBrushState} 
        />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Middle Panel: Workspace Preview */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col p-4">
              <h3 className="font-medium mb-2 text-center">Preview ({smartObjectDimensions.width}x{smartObjectDimensions.height})</h3>
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <SmartObjectWorkspace
                  layers={layers}
                  width={smartObjectDimensions.width}
                  height={smartObjectDimensions.height}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={setSelectedLayerId}
                  onLayerUpdate={handleLayerUpdate}
                  onLayerCommit={handleLayerCommit}
                  mainImage={mainImage}
                  activeTool={activeTool}
                />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          
          {/* Right Panel: Properties and Layers */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
            <ResizablePanelGroup direction="vertical">
              {/* Properties Panel */}
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="p-4 h-full overflow-y-auto flex flex-col">
                  <PropertiesPanel
                    selectedLayer={selectedLayer}
                    activeTool={activeTool}
                    brushState={brushState}
                    setBrushState={setBrushState}
                    gradientToolState={dummyGradientToolState}
                    setGradientToolState={dummySetGradientToolState}
                    onLayerUpdate={handleLayerUpdate}
                    onLayerCommit={handleLayerCommit}
                    onLayerPropertyCommit={handleLayerPropertyCommit}
                    gradientPresets={dummyPresets}
                    onSaveGradientPreset={dummyOnSaveGradientPreset}
                    onDeleteGradientPreset={dummyOnDeleteGradientPreset}
                    foregroundColor={foregroundColor}
                    setForegroundColor={onForegroundColorChange}
                    selectiveBlurStrength={dummySelectiveBlurStrength}
                    onSelectiveBlurStrengthChange={dummyOnSelectiveBlurStrengthChange}
                    onSelectiveBlurStrengthCommit={dummyOnSelectiveBlurStrengthCommit}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              {/* Layers Panel */}
              <ResizablePanel defaultSize={50} minSize={20}>
                <Card className="flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Layers</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                    {/* NEW: Layer Controls for nested layers */}
                    <LayerControls
                      selectedLayer={selectedLayer}
                      onLayerPropertyCommit={(updates, name) => selectedLayerId && handleLayerPropertyCommit(selectedLayerId, updates, name)}
                      onLayerOpacityChange={handleLayerOpacityChange}
                      onLayerOpacityCommit={handleLayerOpacityCommit}
                    />
                    <ScrollArea className="flex-1 pr-3">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={layers.map((l) => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {layers.map((layer) => (
                              <SmartLayerItem
                                key={layer.id}
                                layer={layer}
                                isSelected={selectedLayerId === layer.id}
                                onSelect={() => setSelectedLayerId(layer.id)}
                                onToggleVisibility={handleToggleVisibility}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </ScrollArea>
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" onClick={handleAddTextLayer}>
                          <Type className="h-4 w-4 mr-2" />
                          Add Text
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleAddDrawingLayer}>
                          <Layers className="h-4 w-4 mr-2" />
                          Add Layer
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleAddShapeLayer}>
                          <Square className="h-4 w-4 mr-2" />
                          Add Shape
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleAddGradientLayer}>
                          <Palette className="h-4 w-4 mr-2" />
                          Add Gradient
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDuplicateLayer}
                          disabled={!selectedLayer}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDeleteLayer}
                          disabled={!selectedLayer}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};