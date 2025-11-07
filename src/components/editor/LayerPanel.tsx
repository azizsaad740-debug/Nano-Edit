"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLayerManager } from "@/hooks/useLayerManager";
import { Layers } from "lucide-react";

export const LayerPanel: React.FC = () => {
  const { isLayerPanelOpen, toggleLayerPanel } = useLayerManager();

  return (
    <Dialog open={isLayerPanelOpen} onOpenChange={toggleLayerPanel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> Layers Panel (Modal Stub)
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-muted-foreground">
          This is a modal view of the Layers Panel, typically used for mobile or quick access.
        </div>
      </DialogContent>
    </Dialog>
  );
};