"use client";

import * as React from "react";
import {
  Menu,
  File,
  FolderOpen,
  Save,
  Download,
  Clipboard,
  Plus,
  Settings,
  Maximize,
  Minimize,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Trash2,
  Layers,
  Palette,
  Type,
  Square,
  Droplet,
  Eraser,
  Pencil,
  Stamp,
  History,
  Brush,
  Scissors,
  Wand,
  MousePointer,
  Hand,
  Eye,
  Zap,
  ImagePlus,
  PaintBucket,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Grid,
  Lock,
  Unlock,
  EyeOff,
  Group,
  Ungroup,
  Merge,
  Layers3,
  Mask, // FIX 8: Mask is a valid Lucide icon
  Move,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Minus,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  GripVertical,
  AlignJustify,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  ListOrdered,
  Quote,
  Code2,
  CodeIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button as ShadButton } from "@/components/ui/button";
import { useEditorContext } from "@/context/EditorContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ActiveTool } from "@/types/editor";

export const EditorHeader = () => {
  const editor = useEditorContext();

  const {
    image,
    activeTool,
    setActiveTool,
    canUndo,
    canRedo,
    undo,
    redo,
    handleZoomIn,
    handleZoomOut,
    handleFitScreen,
    handleCopy,
    handleSwapColors,
    handleLayerDelete,
    handleImageLoad,
    handleNewProject,
    handleLoadProject,
    handleLoadTemplate,
    handleNewFromClipboard,
    handleExportClick,
    handleGenerateImage,
    handleGenerativeFill,
    setIsFullscreen,
    isFullscreen,
    setIsSettingsOpen,
    setIsImportOpen,
    setIsGenerateOpen,
    setIsGenerativeFillOpen,
    setIsNewProjectOpen,
    setIsExportOpen,
    setIsProjectSettingsOpen,
    onOpenFontManager,
    selectedLayerId,
    selectedLayer,
    onDuplicateLayer,
    onMergeLayerDown,
    onRasterizeLayer,
    onCreateSmartObject,
    onOpenSmartObject,
    onRasterizeSmartObject,
    onConvertSmartObjectToLayers,
    onExportSmartObjectContents,
    onRemoveLayerMask,
    onInvertLayerMask,
    onToggleClippingMask,
    onToggleLayerLock,
    onDeleteHiddenLayers,
    hasActiveSelection,
    onApplySelectionAsMask,
    handleDestructiveOperation,
    toggleLayerVisibility,
    renameLayer,
    onSelectionSettingCommit, // Keep commit function
    // setSelectionSettings, // REMOVED: FIX 14
  } = editor;

  const isSmartObject = selectedLayer?.type === 'smart-object';
  const isAdjustmentLayer = selectedLayer?.type === 'adjustment';
  const isGroupLayer = selectedLayer?.type === 'group';
  const isBackground = selectedLayerId === 'background';
  const isLocked = selectedLayer?.isLocked;
  const hasMask = !!selectedLayer?.maskDataUrl;

  const handleToolClick = (tool: ActiveTool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  const handleNewProjectClick = () => {
    setIsNewProjectOpen(true);
  };

  const handleOpenClick = () => {
    setIsImportOpen(true);
  };

  const handleExport = () => {
    setIsExportOpen(true);
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleProjectSettings = () => {
    setIsProjectSettingsOpen(true);
  };

  const handleGenerativeFillClick = () => {
    if (!image) {
      editor.showToast('error', 'Please load an image first.');
      return;
    }
    setIsGenerativeFillOpen(true);
  };

  const handleGenerateImageClick = () => {
    setIsGenerateOpen(true);
  };

  const handleLayerDeleteClick = () => {
    if (selectedLayerId) {
      handleLayerDelete();
    }
  };

  const handleDestructiveOperationClick = (operation: 'fill' | 'delete') => {
    if (hasActiveSelection) {
      handleDestructiveOperation(operation);
    } else {
      editor.showToast('error', 'No active selection.');
    }
  };

  const handleApplySelectionAsMaskClick = () => {
    if (selectedLayerId && hasActiveSelection) {
      onApplySelectionAsMask();
    } else {
      editor.showToast('error', 'Select a layer and make a selection first.');
    }
  };

  const handleOpenSmartObjectClick = () => {
    if (isSmartObject && selectedLayerId) {
      onOpenSmartObject(selectedLayerId);
    }
  };

  const handleRasterizeSmartObjectClick = () => {
    if (isSmartObject && selectedLayerId) {
      onRasterizeSmartObject(selectedLayerId);
    }
  };

  const handleConvertSmartObjectToLayersClick = () => {
    if (isSmartObject && selectedLayerId) {
      onConvertSmartObjectToLayers(selectedLayerId);
    }
  };

  const handleExportSmartObjectContentsClick = () => {
    if (isSmartObject && selectedLayerId) {
      onExportSmartObjectContents(selectedLayerId);
    }
  };

  const handleRasterizeLayerClick = () => {
    if (selectedLayerId && !isBackground) {
      onRasterizeLayer(selectedLayerId);
    }
  };

  const handleDuplicateLayerClick = () => {
    if (selectedLayerId) {
      onDuplicateLayer(selectedLayerId);
    }
  };

  const handleMergeLayerDownClick = () => {
    if (selectedLayerId && !isBackground) {
      onMergeLayerDown(selectedLayerId);
    }
  };

  const handleRemoveLayerMaskClick = () => {
    if (selectedLayerId && hasMask) {
      onRemoveLayerMask(selectedLayerId);
    }
  };

  const handleInvertLayerMaskClick = () => {
    if (selectedLayerId && hasMask) {
      onInvertLayerMask(selectedLayerId);
    }
  };

  const handleToggleClippingMaskClick = () => {
    if (selectedLayerId && !isBackground) {
      onToggleClippingMask(selectedLayerId);
    }
  };

  const handleToggleLayerLockClick = () => {
    if (selectedLayerId) {
      onToggleLayerLock(selectedLayerId);
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOpenFontManager = () => {
    onOpenFontManager();
  };

  const menuItems = [
    {
      label: "File",
      items: [
        { label: "New Project...", icon: Plus, action: handleNewProjectClick, shortcut: "Ctrl+N" },
        { label: "Open Image...", icon: FolderOpen, action: handleOpenClick, shortcut: "Ctrl+O" },
        { label: "Load Project...", icon: FolderOpen, action: handleLoadProject, shortcut: "Ctrl+Shift+O" },
        { label: "Load Template...", icon: LayoutGrid, action: handleLoadTemplate, shortcut: "Ctrl+Alt+O" },
        { label: "New from Clipboard", icon: Clipboard, action: handleNewFromClipboard, shortcut: "Ctrl+Shift+V" },
        { type: "separator" },
        { label: "Save Project (JSON)", icon: Save, action: () => editor.showToast('info', 'Save Project Stub'), shortcut: "Ctrl+S" },
        { label: "Export Image...", icon: Download, action: handleExport, shortcut: "Ctrl+E" },
        { type: "separator" },
        { label: "Project Settings...", icon: Settings, action: handleProjectSettings },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", icon: Undo, action: undo, disabled: !canUndo, shortcut: "Ctrl+Z" },
        { label: "Redo", icon: Redo, action: redo, disabled: !canRedo, shortcut: "Ctrl+Shift+Z" },
        { type: "separator" },
        { label: "Copy", icon: Copy, action: handleCopy, shortcut: "Ctrl+C" },
        { label: "Paste", icon: Clipboard, action: () => editor.showToast('info', 'Paste Stub'), shortcut: "Ctrl+V" },
        { type: "separator" },
        { label: "Fill Selection (Foreground)", icon: PaintBucket, action: () => handleDestructiveOperationClick('fill'), disabled: !hasActiveSelection, shortcut: "Alt+Delete" },
        { label: "Delete Selection", icon: Trash2, action: () => handleDestructiveOperationClick('delete'), disabled: !hasActiveSelection, shortcut: "Delete" },
        { type: "separator" },
        { label: "Reset All Edits", icon: RefreshCw, action: editor.resetAllEdits },
      ],
    },
    {
      label: "Image",
      items: [
        { label: "Rotate 90° CW", icon: RotateCw, action: () => editor.onRotationCommit(editor.rotation + 90, 'Rotate 90° CW') },
        { label: "Rotate 90° CCW", icon: RotateCcw, action: () => editor.onRotationCommit(editor.rotation - 90, 'Rotate 90° CCW') },
        { label: "Flip Horizontal", icon: FlipHorizontal, action: () => editor.onTransformChange('scaleX', (editor.transforms.scaleX || 1) * -1) },
        { label: "Flip Vertical", icon: FlipVertical, action: () => editor.onTransformChange('scaleY', (editor.transforms.scaleY || 1) * -1) },
        { type: "separator" },
        { label: "Crop", icon: Crop, action: () => handleToolClick('crop'), shortcut: "C" },
        { label: "Fit to Screen", icon: Maximize2, action: handleFitScreen, shortcut: "Ctrl+0" },
        { label: "Zoom In", icon: ZoomIn, action: handleZoomIn, shortcut: "Ctrl++" },
        { label: "Zoom Out", icon: ZoomOut, action: handleZoomOut, shortcut: "Ctrl+-" },
      ],
    },
    {
      label: "Layer",
      items: [
        { label: "New Layer from Background", icon: Layers, action: editor.onAddLayerFromBackground, disabled: !image },
        { label: "New Layer via Copy", icon: Copy, action: editor.onLayerFromSelection, disabled: !hasActiveSelection },
        { label: "New Text Layer", icon: Type, action: () => editor.addTextLayer({ x: 50, y: 50 }, editor.foregroundColor) },
        { label: "New Shape Layer", icon: Square, action: () => editor.addShapeLayer({ x: 50, y: 50 }, 'rect') },
        { label: "New Gradient Layer", icon: List, action: editor.addGradientLayerNoArgs },
        { type: "separator" },
        { label: "Duplicate Layer", icon: Plus, action: handleDuplicateLayerClick, disabled: !selectedLayerId || isBackground },
        { label: "Delete Layer", icon: Trash2, action: handleLayerDeleteClick, disabled: !selectedLayerId || isBackground },
        { label: "Merge Down", icon: Merge, action: handleMergeLayerDownClick, disabled: !selectedLayerId || isBackground },
        { label: "Group Layers", icon: Group, action: () => editor.groupLayers(editor.selectedLayerIds), disabled: editor.selectedLayerIds.length < 2 },
        { label: "Delete Hidden Layers", icon: EyeOff, action: editor.onDeleteHiddenLayers },
        { type: "separator" },
        { label: "Rasterize Layer", icon: Layers3, action: handleRasterizeLayerClick, disabled: !selectedLayerId || isBackground || isSmartObject || isGroupLayer || isAdjustmentLayer },
        {
          label: "Smart Object",
          items: [
            { label: "Convert to Smart Object", icon: Layers3, action: () => editor.onCreateSmartObject(editor.selectedLayerIds), disabled: editor.selectedLayerIds.length === 0 || isSmartObject },
            { label: "Edit Contents", icon: FolderOpen, action: handleOpenSmartObjectClick, disabled: !isSmartObject },
            { label: "Rasterize Smart Object", icon: Layers3, action: handleRasterizeSmartObjectClick, disabled: !isSmartObject },
            { label: "Convert to Layers", icon: Ungroup, action: handleConvertSmartObjectToLayersClick, disabled: !isSmartObject },
            { label: "Export Contents", icon: Download, action: handleExportSmartObjectContentsClick, disabled: !isSmartObject },
          ],
        },
      ],
    },
    {
      label: "Selection",
      items: [
        { label: "Deselect", icon: MousePointer, action: editor.clearSelectionState, disabled: !editor.selectionMaskDataUrl },
        { label: "Apply Selection as Mask", icon: Mask, action: handleApplySelectionAsMaskClick, disabled: !selectedLayerId || !hasActiveSelection },
        { type: "separator" },
        { label: "Remove Layer Mask", icon: MinusCircle, action: handleRemoveLayerMaskClick, disabled: !selectedLayerId || !hasMask },
        { label: "Invert Layer Mask", icon: RefreshCw, action: handleInvertLayerMaskClick, disabled: !selectedLayerId || !hasMask },
        { label: "Toggle Clipping Mask", icon: Layers, action: handleToggleClippingMaskClick, disabled: !selectedLayerId || isBackground },
        { type: "separator" },
        { label: isLocked ? "Unlock Layer" : "Lock Layer", icon: isLocked ? Unlock : Lock, action: handleToggleLayerLockClick, disabled: !selectedLayerId },
      ],
    },
    {
      label: "AI",
      items: [
        { label: "Generative Fill...", icon: ImagePlus, action: handleGenerativeFillClick, disabled: !image },
        { label: "Generate Image...", icon: Zap, action: handleGenerateImageClick },
      ],
    },
    {
      label: "View",
      items: [
        { label: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen", icon: isFullscreen ? Minimize : Maximize, action: handleToggleFullscreen },
        { label: "Show Settings", icon: Settings, action: handleSettings },
        { label: "Font Manager", icon: List, action: handleOpenFontManager },
      ],
    },
  ];

  const toolButtons = [
    { tool: 'move', icon: Move, tooltip: 'Move Tool (V)' },
    { tool: 'crop', icon: Crop, tooltip: 'Crop Tool (C)' },
    { tool: 'brush', icon: Brush, tooltip: 'Brush Tool (B)' },
    { tool: 'eraser', icon: Eraser, tooltip: 'Eraser Tool (E)' },
    { tool: 'cloneStamp', icon: Stamp, tooltip: 'Clone Stamp Tool (S)' },
    { tool: 'historyBrush', icon: History, tooltip: 'History Brush Tool (Y)' },
    { tool: 'selectionBrush', icon: Brush, tooltip: 'Selection Brush Tool (A)' },
    { tool: 'marqueeRect', icon: Square, tooltip: 'Rectangular Marquee Tool (M)' },
    { tool: 'lassoPoly', icon: Scissors, tooltip: 'Polygonal Lasso Tool (L)' },
    { tool: 'magicWand', icon: Wand, tooltip: 'Magic Wand Tool (W)' },
    { tool: 'text', icon: Type, tooltip: 'Text Tool (T)' },
    { tool: 'gradient', icon: List, tooltip: 'Gradient Tool (G)' },
    { tool: 'eyedropper', icon: Droplet, tooltip: 'Eyedropper Tool (I)' },
    { tool: 'hand', icon: Hand, tooltip: 'Hand Tool (H)' },
    { tool: 'zoom', icon: ZoomIn, tooltip: 'Zoom Tool (Z)' },
  ];

  return (
    <header className="flex items-center justify-between h-10 px-2 border-b bg-background/90 backdrop-blur-sm z-50">
      <div className="flex items-center space-x-1">
        {menuItems.map((menu) => (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger asChild>
              <ShadButton variant="ghost" size="sm" className="text-xs h-8">
                {menu.label}
              </ShadButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>{menu.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {menu.items.map((item, index) =>
                item.type === "separator" ? (
                  <DropdownMenuSeparator key={index} />
                ) : item.items ? (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{item.label}</span>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-56">
                      {item.items.map((subItem, subIndex) => (
                        <DropdownMenuItem
                          key={subIndex}
                          onClick={subItem.action}
                          disabled={subItem.disabled}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            {subItem.icon && <subItem.icon className="mr-2 h-4 w-4" />}
                            <span>{subItem.label}</span>
                          </div>
                          {subItem.shortcut && <span className="text-xs text-muted-foreground">{subItem.shortcut}</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={item.action}
                    disabled={item.disabled}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      <span>{item.label}</span>
                    </div>
                    {item.shortcut && <span className="text-xs text-muted-foreground">{item.shortcut}</span>}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      {/* Tool Bar */}
      <div className="flex items-center space-x-1">
        <TooltipProvider>
          {toolButtons.map(({ tool, icon: Icon, tooltip }) => (
            <Tooltip key={tool}>
              <TooltipTrigger asChild>
                <ShadButton
                  variant={activeTool === tool ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToolClick(tool as ActiveTool)}
                >
                  <Icon className="h-4 w-4" />
                </ShadButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center space-x-2">
        <ShadButton variant="ghost" size="sm" className="h-8 text-xs" onClick={handleSettings}>
          <Settings className="h-4 w-4 mr-1" /> Settings
        </ShadButton>
        <Separator orientation="vertical" className="h-6" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ShadButton variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleFullscreen}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </ShadButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};