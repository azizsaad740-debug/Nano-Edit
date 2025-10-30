"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // Import cn utility

interface WorkspaceProps {
  workspaceRef: React.RefObject<HTMLDivElement>;
  handleWorkspaceMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  setIsMouseOverImage: (isOver: boolean) => void;
  children: React.ReactNode;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  workspaceRef,
  handleWorkspaceMouseDown,
  handleWorkspaceMouseMove,
  handleWorkspaceMouseUp,
  handleWheel,
  setIsMouseOverImage,
  children,
}) => {
  return (
    <div
      ref={workspaceRef}
      className={cn(
        "relative w-full h-full overflow-hidden flex items-center justify-center", // Added flex centering
        // ... other classes
      )}
      onMouseDown={handleWorkspaceMouseDown}
      onMouseMove={handleWorkspaceMouseMove}
      onMouseUp={handleWorkspaceMouseUp}
      onWheel={handleWheel}
      onMouseEnter={() => setIsMouseOverImage(true)}
      onMouseLeave={() => setIsMouseOverImage(false)}
    >
      {children}
    </div>
  );
};