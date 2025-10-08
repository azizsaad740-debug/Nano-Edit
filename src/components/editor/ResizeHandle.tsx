"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onMouseDown: (
    e: React.MouseEvent<HTMLDivElement>,
    position: ResizeHandleProps["position"]
  ) => void;
}

const positionClasses = {
  "top-left": "top-0 left-0 cursor-nwse-resize",
  "top-right": "top-0 right-0 cursor-nesw-resize",
  "bottom-left": "bottom-0 left-0 cursor-nesw-resize",
  "bottom-right": "bottom-0 right-0 cursor-nwse-resize",
};

export const ResizeHandle = ({ position, onMouseDown }: ResizeHandleProps) => {
  return (
    <div
      className={cn(
        "absolute w-3 h-3 bg-background border-2 border-primary rounded-full -m-1.5",
        positionClasses[position]
      )}
      onMouseDown={(e) => onMouseDown(e, position)}
    />
  );
};