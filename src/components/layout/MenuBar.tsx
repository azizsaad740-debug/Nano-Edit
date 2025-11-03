import React from 'react';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from '@/components/ui/menubar';
import {
  FilePlus, FolderOpen, Save, Download, FilePlus2, ClipboardPaste, Undo2, Redo2, Copy, Trash2,
  Crop, RotateCw, ArrowLeftRight, ArrowUpDown, Settings, Type, Square, Palette, Layers, Group,
  Zap, Minus, Check, Maximize, Minimize,
} from 'lucide-react';
import type { useEditorLogic } from '@/hooks/useEditorLogic';
import { showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface MenuBarProps {
    logic: ReturnType<typeof useEditorLogic>;
    setIsNewProjectOpen: (open: boolean) => void;
    setIsExportOpen: (open: boolean) => void;
    setIsSettingsOpen: (open: boolean) => void;
    setIsImportOpen: (open: boolean) => void;
    setIsGenerateOpen: (open: boolean) => void;
    setIsGenerativeFillOpen: (open: boolean) => void;
    setIsProjectSettingsOpen: (open: boolean) => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    panelLayout: any[]; // Not directly used here, but kept for interface consistency
    togglePanelVisibility: (id: string) => void;
    activeRightTab: string;
    setActiveRightTab: (tab: string) => void;
    activeBottomTab: string;
    setActiveBottomTab: (tab: string) => void;
}

export const MenuBar: React.FC<MenuBarProps> = (props) => {
    const { logic } = props;
    const {
        image, hasImage, undo, redo, canUndo, canRedo, handleCopy, clearSelectionState,
        onTransformChange, rotation, onRotationChange, onRotationCommit,
        activeTool, setActiveTool, selectedShapeType, setSelectedShapeType,
        selectedLayerId, selectedLayer, hasActiveSelection, handleDestructiveOperation,
        addTextLayer, addShapeLayer, addGradientLayerNoArgs, onAddAdjustmentLayer,
        onDuplicateLayer, deleteLayer, groupLayers, onLayerFromSelection,
        foregroundColor,
    } = logic;

    const handleOpenProject = () => document.getElementById('file-upload-input')?.click();
    const handleNewFromClipboard = () => logic.handleNewFromClipboard(false);
    const handleSaveProject = () => showError("Project saving is a stub.");
    
    const handleNewLayer = (type: 'text' | 'shape' | 'gradient' | 'adjustment') => {
        if (!image) {
            showError("Please load an image or create a new project first.");
            return;
        }
        if (type === 'text') {
            addTextLayer({ x: 50, y: 50 }, foregroundColor);
        } else if (type === 'shape') {
            addShapeLayer({ x: 50, y: 50 }, selectedShapeType || 'rect');
        } else if (type === 'gradient') {
            addGradientLayerNoArgs();
        } else if (type === 'adjustment') {
            onAddAdjustmentLayer('brightness');
        }
    };
    
    const handleDelete = () => {
        if (selectedLayerId) {
            logic.handleLayerDelete();
        } else if (hasActiveSelection) {
            handleDestructiveOperation('delete');
        } else {
            showError("Nothing selected to delete.");
        }
    };
    
    const handleFill = () => {
        if (hasActiveSelection) {
            handleDestructiveOperation('fill');
        } else {
            showError("Please make a selection first to use Fill.");
        }
    };
    
    const isLayerSelected = !!selectedLayerId && selectedLayerId !== 'background';
    const isVectorShape = selectedLayer?.type === 'vector-shape';

    return (
        <Menubar className="border-none shadow-none h-10 p-0">
            {/* File Menu */}
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={() => props.setIsNewProjectOpen(true)}>
                        <FilePlus className="h-4 w-4 mr-2" /> New... <span className="ml-auto text-xs text-muted-foreground">Ctrl+N</span>
                    </MenubarItem>
                    <MenubarItem onClick={handleOpenProject}>
                        <FolderOpen className="h-4 w-4 mr-2" /> Open... <span className="ml-auto text-xs text-muted-foreground">Ctrl+O</span>
                    </MenubarItem>
                    <MenubarItem onClick={handleNewFromClipboard}>
                        <ClipboardPaste className="h-4 w-4 mr-2" /> New from Clipboard
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={handleSaveProject} disabled={!hasImage}>
                        <Save className="h-4 w-4 mr-2" /> Save Project <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+S</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => props.setIsExportOpen(true)} disabled={!hasImage}>
                        <Download className="h-4 w-4 mr-2" /> Export Image <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => props.setIsGenerateOpen(true)} disabled={!hasImage}>
                        <Zap className="h-4 w-4 mr-2" /> Generate New Image
                    </MenubarItem>
                    <MenubarItem onClick={() => props.setIsImportOpen(true)}>
                        <FilePlus2 className="h-4 w-4 mr-2" /> Import Preset / LUT
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            {/* Edit Menu */}
            <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={() => undo()} disabled={!canUndo}>
                        <Undo2 className="h-4 w-4 mr-2" /> Undo <span className="ml-auto text-xs text-muted-foreground">Ctrl+Z</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => redo()} disabled={!canRedo}>
                        <Redo2 className="h-4 w-4 mr-2" /> Redo <span className="ml-auto text-xs text-muted-foreground">Ctrl+Y</span>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={handleCopy} disabled={!hasImage}>
                        <Copy className="h-4 w-4 mr-2" /> Copy <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => showError("Paste is a stub.")} disabled={!hasImage}>
                        <ClipboardPaste className="h-4 w-4 mr-2" /> Paste (Stub) <span className="ml-auto text-xs text-muted-foreground">Ctrl+V</span>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={handleFill} disabled={!hasActiveSelection}>
                        <Palette className="h-4 w-4 mr-2" /> Fill Selection
                    </MenubarItem>
                    <MenubarItem onClick={handleDelete} disabled={!isLayerSelected && !hasActiveSelection}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete <span className="ml-auto text-xs text-muted-foreground">Del</span>
                    </MenubarItem>
                    <MenubarItem onClick={clearSelectionState} disabled={!hasActiveSelection}>
                        <Minus className="h-4 w-4 mr-2" /> Deselect <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => props.setIsGenerativeFillOpen(true)} disabled={!hasActiveSelection || !hasImage}>
                        <Zap className="h-4 w-4 mr-2" /> Generative Fill <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+G</span>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            {/* Image Menu */}
            <MenubarMenu>
                <MenubarTrigger disabled={!hasImage}>Image</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={() => props.setIsProjectSettingsOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" /> Project Settings
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarSub>
                        <MenubarSubTrigger>Transform</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem onClick={() => onTransformChange('rotate-right')}>
                                <RotateCw className="h-4 w-4 mr-2" /> Rotate 90° CW <span className="ml-auto text-xs text-muted-foreground">R</span>
                            </MenubarItem>
                            <MenubarItem onClick={() => onTransformChange('rotate-left')}>
                                <RotateCw className="h-4 w-4 mr-2" /> Rotate 90° CCW <span className="ml-auto text-xs text-muted-foreground">Shift+R</span>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={() => onTransformChange('flip-horizontal')}>
                                <ArrowLeftRight className="h-4 w-4 mr-2" /> Flip Horizontal <span className="ml-auto text-xs text-muted-foreground">H</span>
                            </MenubarItem>
                            <MenubarItem onClick={() => onTransformChange('flip-vertical')}>
                                <ArrowUpDown className="h-4 w-4 mr-2" /> Flip Vertical <span className="ml-auto text-xs text-muted-foreground">V</span>
                            </MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarItem onClick={() => logic.setActiveTool('crop')}>
                        <Crop className="h-4 w-4 mr-2" /> Crop Tool <span className="ml-auto text-xs text-muted-foreground">C</span>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => showError("Image Size is a stub.")}>
                        Image Size... (Stub)
                    </MenubarItem>
                    <MenubarItem onClick={() => showError("Canvas Size is a stub.")}>
                        Canvas Size... (Stub)
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            {/* Layer Menu */}
            <MenubarMenu>
                <MenubarTrigger disabled={!hasImage}>Layer</MenubarTrigger>
                <MenubarContent>
                    <MenubarSub>
                        <MenubarSubTrigger>New Layer</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem onClick={() => handleNewLayer('text')}>
                                <Type className="h-4 w-4 mr-2" /> Text Layer
                            </MenubarItem>
                            <MenubarItem onClick={() => handleNewLayer('shape')}>
                                <Square className="h-4 w-4 mr-2" /> Shape Layer
                            </MenubarItem>
                            <MenubarItem onClick={() => handleNewLayer('gradient')}>
                                <Palette className="h-4 w-4 mr-2" /> Gradient Layer
                            </MenubarItem>
                            <MenubarItem onClick={() => handleNewLayer('adjustment')}>
                                <Zap className="h-4 w-4 mr-2" /> Adjustment Layer
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={() => logic.onAddLayerFromBackground()}>
                                <Layers className="h-4 w-4 mr-2" /> Layer from Background
                            </MenubarItem>
                            <MenubarItem onClick={() => logic.onLayerFromSelection()} disabled={!hasActiveSelection}>
                                <Layers className="h-4 w-4 mr-2" /> Layer via Copy/Cut
                            </MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => isLayerSelected && logic.onDuplicateLayer(selectedLayerId!)} disabled={!isLayerSelected}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate Layer
                    </MenubarItem>
                    <MenubarItem onClick={() => isLayerSelected && logic.deleteLayer(selectedLayerId!)} disabled={!isLayerSelected}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Layer
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => logic.groupLayers(selectedLayerId ? [selectedLayerId] : [])} disabled={!isLayerSelected}>
                        <Group className="h-4 w-4 mr-2" /> Group Layers (Stub)
                    </MenubarItem>
                    <MenubarItem onClick={() => logic.onCreateSmartObject(selectedLayerId ? [selectedLayerId] : [])} disabled={!isLayerSelected}>
                        <Layers className="h-4 w-4 mr-2" /> Convert to Smart Object (Stub)
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => isLayerSelected && logic.onRasterizeLayer(selectedLayerId!)} disabled={!isLayerSelected || !isVectorShape}>
                        <Layers className="h-4 w-4 mr-2" /> Rasterize Layer
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            
            {/* View Menu */}
            <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={logic.handleZoomIn}>
                        Zoom In <span className="ml-auto text-xs text-muted-foreground">Ctrl+=</span>
                    </MenubarItem>
                    <MenubarItem onClick={logic.handleZoomOut}>
                        Zoom Out <span className="ml-auto text-xs text-muted-foreground">Ctrl+-</span>
                    </MenubarItem>
                    <MenubarItem onClick={logic.handleFitScreen}>
                        Fit on Screen <span className="ml-auto text-xs text-muted-foreground">F</span>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={props.onToggleFullscreen}>
                        {props.isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
                        {props.isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            
            {/* Window Menu */}
            <MenubarMenu>
                <MenubarTrigger>Window</MenubarTrigger>
                <MenubarContent>
                    {props.panelLayout.filter(t => t.location !== 'hidden').map((tab) => (
                        <MenubarItem key={tab.id} onClick={() => props.togglePanelVisibility(tab.id)}>
                            {tab.visible ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2" />}
                            {tab.name}
                        </MenubarItem>
                    ))}
                    <MenubarSeparator />
                    <MenubarItem onClick={() => showError("Reset Workspace is a stub.")}>
                        Reset Workspace (Stub)
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
};