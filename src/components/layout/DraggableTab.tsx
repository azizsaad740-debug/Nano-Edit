"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import type { PanelTab } from "@/types/editor/core";
import { TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DraggableTabProps {
  tab: PanelTab;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export const DraggableTab: React.FC<DraggableTabProps> = ({ tab, isActive, onSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const Icon = tab.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TabsTrigger
          ref={setNodeRef}
          value={tab.id}
          className={cn(
            "h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background flex items-center gap-1 p-2 relative",
            isDragging && "opacity-50 shadow-lg"
          )}
          style={style}
          onClick={() => onSelect(tab.id)}
        >
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none p-1 -ml-1 -mr-1"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          {React.createElement(Icon as React.ElementType, { className: "h-4 w-4" })}
          <span className="hidden sm:inline text-sm">{tab.name}</span>
        </TabsTrigger>
      </TooltipTrigger>
      <TooltipContent side="top">
        {tab.name}
      </TooltipContent>
    </Tooltip>
  );
};