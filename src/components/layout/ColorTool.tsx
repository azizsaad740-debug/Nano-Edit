"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ColorToolProps {
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
}

export const ColorTool = ({
  foregroundColor,
  onForegroundColorChange,
  backgroundColor,
  onBackgroundColorChange,
  onSwapColors,
}: ColorToolProps) => {
  const foregroundInputRef = React.useRef<HTMLInputElement>(null);
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative w-10 h-10 rounded-md border-2 border-primary cursor-pointer"
            style={{ backgroundColor: foregroundColor }}
            onClick={() => foregroundInputRef.current?.click()}
          >
            <input
              ref={foregroundInputRef}
              type="color"
              value={foregroundColor}
              onChange={(e) => onForegroundColorChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Foreground Color</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSwapColors}
            className="h-6 w-6"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Swap Colors (X)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative w-10 h-10 rounded-md border-2 border-muted-foreground cursor-pointer"
            style={{ backgroundColor: backgroundColor }}
            onClick={() => backgroundInputRef.current?.click()}
          >
            <input
              ref={backgroundInputRef}
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Background Color</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};