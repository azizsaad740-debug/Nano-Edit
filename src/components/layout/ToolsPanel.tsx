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
  MousePointer, // Quick Selection icon (Fixed: Replaced MousePointerSquare)
  Wand2, // Magic Wand icon
  ScanEye, // Object Selection icon
  MousePointer2, // Lasso icon
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
import type { Layer, ActiveTool, BrushState } from "@/types/editor";
import { ColorTool } from "./ColorTool";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";

type Tool = ActiveTool;

interface ToolsPanelProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
  selectedShapeType: Layer['shapeType'] | null;
  setSelectedShapeType: (type: Layer['shapeType'] | null) => void;
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  selectiveBlurStrength: number;
  onSelectiveBlurStrengthChange: (value: number) => void;
  onSelectiveBlurStrengthCommit: (value: number) => void;
}

// --- Tool Definitions ---

const selectionTools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string; group: 'marquee' | 'lasso' | 'quick' | 'magic' | 'object' }[] = [
  // Marquee Group (M)
  { name: "Rectangular Marquee", icon: SquareDashedMousePointer, tool: "marqueeRect", shortcut: "M", group: 'marquee' },
  { name: "Elliptical Marquee", icon: Circle, tool: "marqueeEllipse", shortcut: "Shift+M", group: 'marquee' },
  // Lasso Group (L)
  { name: "Lasso Tool (Freehand)", icon: MousePointer2, tool: "lasso", shortcut: "L", group: 'lasso' },
  { name: "Polygonal Lasso", icon: PenTool, tool: "lassoPoly", shortcut: "Shift+L", group: 'lasso' },
  // Quick Selection Group (W)
  { name: "Quick Selection", icon: MousePointer, tool: "quickSelect", shortcut: "W", group: 'quick' },
  { name: "Magic Wand", icon: Wand2, tool: "magicWand", shortcut: "Shift+W", group: 'magic' },
  // Object Selection Group (A)
  { name: "Object Selection", icon: ScanEye, tool: "objectSelect", shortcut: "A", group: 'object' },
];

const brushTools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string; group: 'paint' | 'mask' }[] = [
  { name: "Brush Tool", icon: Brush, tool: "brush", shortcut: "B", group: 'paint' },
  { name: "Eraser Tool", icon: Eraser, tool: "eraser", shortcut: "E", group: 'paint' },
  { name: "Selection Brush", icon: Paintbrush, tool: "selectionBrush", shortcut: "S", group: 'mask' },
  { name: "Blur Brush", icon: Droplet, tool: "blurBrush", shortcut: "U", group: 'mask' },
];

const shapeSubTools: { name: string; icon: React.ElementType; type: Layer['shapeType'] }[] = [
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
  tools: typeof selectionTools | typeof brushTools;
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
        <TooltipContent side="right">
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
  selectiveBlurStrength,
  onSelectiveBlurStrengthChange,
  onSelectiveBlurStrengthCommit,
}: ToolsPanelProps) => {
  const currentShapeIcon = React.useMemo(() => {
    const subTool = shapeSubTools.find(st => st.type === selectedShapeType);
    return subTool ? subTool.icon : Square;
  }, [selectedShapeType]);

  const handleShapeToolSelect = (type: Layer['shapeType']) => {
    setActiveTool("shape");
    setSelectedShapeType(type);
  };

  const isBrushTool = activeTool === 'brush' || activeTool === 'eraser';
  const isSelectionBrushActive = activeTool === 'selectionBrush';
  const isBlurBrushActive = activeTool === 'blurBrush';
  const isAnyBrushActive = isBrushTool || isSelectionBrushActive || isBlurBrushActive;

  // Group selection tools by their default tool/shortcut
  const marqueeTools = selectionTools.filter(t => t.group === 'marquee');
  const lassoTools = selectionTools.filter(t => t.group === 'lasso');
  const quickSelectTools = selectionTools.filter(t => t.group === 'quick' || t.group === 'magic');
  const objectSelectTools = selectionTools.filter(t => t.group === 'object');
  
  // Group brush tools
  const paintTools = brushTools.filter(t => t.group === 'paint');
  const maskTools = brushTools.filter(t => t.group === 'mask');

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
          
          {/* 2. Selection Tools Group */}
          <ToolGroupDropdown
            tools={marqueeTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="marqueeRect"
            icon={SquareDashedMousePointer}
            groupName="Marquee Selection"
            shortcut="M"
          />
          <ToolGroupDropdown
            tools={lassoTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="lasso"
            icon={MousePointer2}
            groupName="Lasso Tools"
            shortcut="L"
          />
          <ToolGroupDropdown
            tools={quickSelectTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="quickSelect"
            icon={MousePointer}
            groupName="Quick Selection Tools"
            shortcut="W"
          />
          <ToolGroupDropdown
            tools={objectSelectTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="objectSelect"
            icon={ScanEye}
            groupName="Object Selection Tools"
            shortcut="A"
          />

          {/* 3. Brush Tools Group */}
          <ToolGroupDropdown
            tools={paintTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="brush"
            icon={Brush}
            groupName="Painting Tools"
            shortcut="B"
          />
          <ToolGroupDropdown
            tools={maskTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            defaultTool="selectionBrush"
            icon={Paintbrush}
            groupName="Masking Tools"
            shortcut="S"
          />
          
          {/* 4. Text Tool */}
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

          {/* 5. Shape Tool Group */}
          <DropdownMenu>
            <Tooltip>
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
          
          {/* 6. Gradient Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === "gradient" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setActiveTool("gradient" === activeTool ? null : "gradient")}
                className={cn("w-10 h-10", activeTool === "gradient" && "bg-secondary")}
              >
                <Palette className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Gradient Tool (G)</p>
            </TooltipContent>
          </Tooltip>

          {/* 7. Crop Tool */}
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

          {/* 8. Eyedropper Tool */}
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
          
          {isAnyBrushActive && (
            <div className="mt-4 w-full space-y-4">
              <BrushOptions
                activeTool={activeTool as "brush" | "eraser"}
                brushSize={brushState.size}
                setBrushSize={(size) => setBrushState({ size })}
                brushOpacity={brushState.opacity}
                setBrushOpacity={(opacity) => setBrushState({ opacity })}
                foregroundColor={foregroundColor}
                setForegroundColor={onForegroundColorChange}
                brushHardness={brushState.hardness}
                setBrushHardness={(hardness) => setBrushState({ hardness })}
                brushSmoothness={brushState.smoothness}
                setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
                brushShape={brushState.shape}
                setBrushShape={(shape) => setBrushState({ shape })}
              />
              {isBlurBrushActive && (
                <BlurBrushOptions
                  selectiveBlurStrength={selectiveBlurStrength}
                  onStrengthChange={onSelectiveBlurStrengthChange}
                  onStrengthCommit={onSelectiveBlurStrengthCommit}
                />
              )}
            </div>
          )}
        </div>
      </TooltipProvider>
    </aside>
  );
};