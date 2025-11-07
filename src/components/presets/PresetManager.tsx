"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePresetManager } from "@/hooks/usePresetManager";
import { Image } from "lucide-react";

export const PresetManager: React.FC = () => {
  const { isPresetManagerOpen, togglePresetManager } = usePresetManager();

  return (
    <Dialog open={isPresetManagerOpen} onOpenChange={togglePresetManager}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" /> Preset Manager (Modal Stub)
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-muted-foreground">
          This is a modal view of the Preset Manager.
        </div>
      </DialogContent>
    </Dialog>
  );
};