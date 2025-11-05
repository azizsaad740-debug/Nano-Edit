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
  Square, // FIX 1: Corrected Lucide import syntax
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
  Move, // FIX 1: Corrected Lucide import syntax
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button as ShadButton } from "@/components/ui/button";
import { useEditorContext } from "@/context/EditorContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ActiveTool } from "@/types/editor";

export const EditorHeader = () => { // FIX 10: Ensure component is exported
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
    // ... rest of the logic
  } = editor;

  // ... rest of the component
  return (
    <header className="flex items-center justify-between h-10 px-2 border-b bg-background/90 z-10">
      {/* ... content ... */}
    </header>
  );
};