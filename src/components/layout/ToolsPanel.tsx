"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Brush,
  Type,
  Crop as CropIcon,
  Eraser,
  Pipette,
  Square,
  RectangleHorizontal,
  Circle,
  Triangle,
  ChevronDown,
  Hand,
  Palette,
  Paintbrush,
  Droplet,
  Star,
  Minus,
  ArrowRight,
  PenTool,
  Move,
  SquareDashedMousePointer, // Marquee icon
  MousePointer, // Quick Selection icon
  Wand2, // Magic Wand icon
  ScanEye, // Object Selection icon
  MousePointer2, // Lasso icon
  PaintBucket, 
  Stamp, 
  History, 
  Focus, // Used for Sharpen/Blur/Smudge
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Layer, ActiveTool, BrushState, ShapeType } from "@/types/editor"; // Import ShapeType
import { ColorTool } from "./ColorTool";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";

type Tool = ActiveTool;

// --- Tool Definitions ---

const selectionTools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string; group: 'marquee' | 'lasso' | 'quick' | 'magic' | 'object' }[] = [
  // Marquee Group (M)
  { name: "Rectangular Marquee", icon: SquareDashedMousePointer, tool: "marqueeRect", shortcut: "M", group: 'marquee' },
  { name: "Elliptical Marquee", icon: Circle, tool: "marqueeEllipse", shortcut: "Shift+M", group: 'marquee' },
  { name: "Lasso Tool (Freehand)", icon: MousePointer2, tool: "lasso", shortcut: "L", group: 'lasso' },
  { name: "Polygonal Lasso", icon: PenTool, tool: "lassoPoly", shortcut: "Shift+L", group: 'lasso' },
  { name: "Quick Selection", icon: MousePointer, tool: "quickSelect", shortcut: "W", group: 'quick' },
  { name: "Magic Wand", icon: Wand2, tool: "magicWand", shortcut: "Shift+W", group: 'magic' },
  { name: "Object Selection", icon: ScanEye, tool: "objectSelect", shortcut: "A", group: 'object' },
];

const paintAndFillTools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string; group: 'paint' | 'fill' | 'gradient' }[] = [
  { name: "Brush Tool", icon: Brush, tool: "brush", shortcut: "B", group: 'paint' },
  { name: "Pencil Tool", icon: Pencil, tool: "pencil", shortcut: "Shift+B", group: 'paint' },
  { name: "Eraser Tool", icon: Eraser, tool: "eraser", shortcut: "E", group: 'paint' },
  { name: "Paint Bucket Tool", icon: PaintBucket, tool: "paintBucket", shortcut: "G", group: 'fill' },
  { name: "Gradient Tool", icon: Palette, tool: "gradient", shortcut: "Shift+G", group: 'gradient' },
];

const stampAndHistoryTools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string; group: 'stamp' | 'history' }[] = [
  { name: "Clone Stamp Tool", icon: Stamp, tool: "cloneStamp", shortcut: "S", group: 'stamp' },
  { name: "Pattern Stamp Tool", icon: Stamp, tool: "patternStamp", shortcut: "Shift+S", group: 'stamp' },
  { name: "History Brush Tool", icon: History, tool: "historyBrush", shortcut: "Y", group: 'history' },
  { name: "Art History Brush Tool", icon: History, tool: "artHistoryBrush", shortcut: "Shift+Y", group: 'history' },
];

const retouchAndMaskTools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string; group: 'retouch' | 'mask' }[] = [
  { name: "Blur Brush", icon: Droplet, tool: "blurBrush", shortcut: "U", group: 'retouch' },
  { name: "Sharpen Tool", icon: Focus, tool: "sharpenTool", shortcut: "Shift+U", group: 'retouch' },
  { name: "Selection Brush", icon: Paintbrush, tool: "selectionBrush", shortcut: "Q", group: 'mask' },
];

const shapeSubTools: { name: string; icon: React.ElementType; type: ShapeType }[] = [ // FIXED TYPE
  { name: "Rectangle", icon: RectangleHorizontal, type: "rect" },
  { name: "Circle", icon: Circle, type: "circle" },
  { name: "Triangle", icon: Triangle, type: "triangle" },
  { name: "Star", icon: Star, type: "star" },
  { name: "Line", icon: Minus, type: "line" },
  { name: "Arrow", icon: ArrowRight, type: "arrow" },
  { name: "Custom Path", icon: PenTool, type: "custom" },
];

// --- Helper Components ---

interface ToolGroupDropdownProps {
  tools: typeof selectionTools | typeof paintAndFillTools | typeof stampAndHistoryTools | typeof retouchAndMaskTools;
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
  defaultTool: Tool;
  icon: React.ElementType;
  groupName: string;
  shortcut: string;
}

const ToolGroupDropdown: React.FC<ToolGroupDropdownProps> = ({
  tools,
  activeTool,
  setActiveTool,
  defaultTool,
  icon: GroupIcon,
  groupName,
  shortcut,
}) => {
  const currentTool = tools.find(t => t.tool === activeTool) || tools.find(t => t.tool === defaultTool);
  const currentIcon = currentTool?.icon || GroupIcon;

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <Button
            variant={activeTool && tools.map(t => t.tool).includes(activeTool) ? "secondary" : "ghost"}
            size="icon"
            className={cn("w-10 h-10", activeTool && tools.map(t => t.tool).includes(activeTool) && "bg-secondary")}
            onClick={() => setActiveTool(currentTool?.tool === activeTool ? null : currentTool?.tool || defaultTool)}
          >
            {React.createElement(currentIcon, { className: "h-5 w-5" })}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <TooltipContent side="right" className="z-50">
          <p>{groupName} ({shortcut})</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" align="start" className="w-48">
        {tools.map((item) => (
          <DropdownMenuItem key={item.name} onClick={() => handleToolSelect(item.tool)}>
            {React.createElement(item.icon, { className: "h-4 w-4 mr-2" })}
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


// --- Main Tools Panel ---

interface ToolsPanelProps {
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
  selectedShapeType: ShapeType | null;
  setSelectedShapeType: (type: ShapeType | null) => void;
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
}

export const ToolsPanel = ({ 
  activeTool, 
  setActiveTool, 
  selectedShapeType, 
  setSelectedShapeType,
  foregroundColor,
  onForegroundColorChange,
  backgroundColor,
  onBackgroundColorChange,
  onSwapColors,
  brushState,
  setBrushState,
  selectiveBlurAmount,
  onSelectiveBlurAmountChange,
  onSelectiveBlurAmountCommit,
}: ToolsPanelProps) => {
  const currentShapeIcon = React.useMemo(() => {
    const subTool = shapeSubTools.find(st => st.type === selectedShapeType);
    return subTool ? subTool.icon : Square;
  }, [selectedShapeType]);

  const handleShapeToolSelect = (type: ShapeType) => { // FIXED TYPE
    setActiveTool("shape");
    setSelectedShapeType(type);
  };

  const isPaintToolActive = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'pencil';
  const isSelectionBrushActive = activeTool === 'selectionBrush';
  const isBlurBrushActive = activeTool === 'blurBrush';
  const isAnyBrushActive = isPaintToolActive || isSelectionBrushActive || isBlurBrushActive;
  
  const isGradientToolActive = activeTool === 'gradient';
  const isPaintBucketToolActive = activeTool === 'paintBucket';
  const isStampToolActive = activeTool === 'patternStamp' || activeTool === 'cloneStamp';
  const isHistoryBrushToolActive = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';

  return (
    <aside className="h-full border-r bg-muted/40 p-2 flex flex-col">
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col items-center gap-2">
          
          {/* 1. Move Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === "move" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setActiveTool("move" === activeTool ? null : "move")}
                className={cn("w-10 h-10", activeTool === "move" && "bg-secondary")}
              >
                <Move className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Move Tool (V)</p>
            </TooltipContent>
          </Tooltip>
          
          {/* 2. Selection Tools Group (Marquee, Lasso, Quick Select, Magic Wand, Object Select) */}
          <ToolGroupDropdown
            tools={selectionTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="marqueeRect"
            icon={SquareDashedMousePointer}
            groupName="Selection Tools"
            shortcut="M/L/W/A"
          />

          {/* 3. Crop Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === "crop" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setActiveTool("crop" === activeTool ? null : "crop")}
                className={cn("w-10 h-10", activeTool === "crop" && "bg-secondary")}
              >
                <CropIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Crop Tool (C)</p>
            </TooltipContent>
          </Tooltip>
          
          {/* 4. Paint/Fill Tools Group (Brush, Pencil, Eraser, Paint Bucket, Gradient) */}
          <ToolGroupDropdown
            tools={paintAndFillTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="brush"
            icon={Brush}
            groupName="Painting & Fill Tools"
            shortcut="B/E/G"
          />
          
          {/* 5. Stamp/History Tools Group */}
          <ToolGroupDropdown
            tools={stampAndHistoryTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="cloneStamp"
            icon={Stamp}
            groupName="Stamp & History Tools"
            shortcut="S/Y"
          />

          {/* 6. Retouching & Masking Tools Group (Blur, Sharpen, Selection Brush) */}
          <ToolGroupDropdown
            tools={retouchAndMaskTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="blurBrush"
            icon={Droplet}
            groupName="Retouching & Masking"
            shortcut="U/Q"
          />
          
          {/* 7. Text Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === "text" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setActiveTool("text" === activeTool ? null : "text")}
                className={cn("w-10 h-10", activeTool === "text" && "bg-secondary")}
              >
                <Type className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Text Tool (T)</p>
            </TooltipContent>
          </Tooltip>

          {/* 8. Shape Tool Group */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={activeTool === "shape" ? "secondary" : "ghost"}
                    size="icon"
                    className={cn("w-10 h-10", activeTool === "shape" && "bg-secondary")}
                    onClick={() => setActiveTool(activeTool === "shape" ? null : "shape")}
                  >
                    {React.createElement(currentShapeIcon, { className: "h-5 w-5" })}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Shape Tool (P)</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-40">
              {shapeSubTools.map((subTool) => (
                <DropdownMenuItem key={subTool.name} onClick={() => handleShapeToolSelect(subTool.type)}>
                  {React.createElement(subTool.icon, { className: "h-4 w-4 mr-2" })}
                  {subTool.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* 9. Eyedropper Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === "eyedropper" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setActiveTool("eyedropper" === activeTool ? null : "eyedropper")}
                className={cn("w-10 h-10", activeTool === "eyedropper" && "bg-secondary")}
              >
                <Pipette className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Eyedropper Tool (I)</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-full h-px bg-border my-2" />

          {/* Color Tool */}
          <ColorTool
            foregroundColor={foregroundColor}
            onForegroundColorChange={onForegroundColorChange}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={onBackgroundColorChange}
            onSwapColors={onSwapColors}
          />
          {(isSelectionBrushActive || isBlurBrushActive) && (
            <div className="text-xs text-muted-foreground text-center mt-1">
              {isSelectionBrushActive && (
                <>Foreground: Add to selection <br /> Background: Subtract from selection</>
              )}
              {isBlurBrushActive && (
                <>Foreground: Add Blur <br /> Background: Remove Blur</>
              )}
            </div>
          )}
          
          {(isAnyBrushActive || isGradientToolActive || isPaintBucketToolActive || isStampToolActive || isHistoryBrushToolActive) && (
            <div className="mt-4 w-full space-y-4">
              {/* We rely on RightSidebarTabs to render the correct options component */}
              <p className="text-sm text-muted-foreground text-center">
                Tool Options in Properties Panel
              </p>
            </div>
          )}
        </div>
      </TooltipProvider>
    </aside>
  );
};