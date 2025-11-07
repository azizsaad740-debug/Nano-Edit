"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHistoryManager } from "@/hooks/useHistoryManager";
import { History } from "lucide-react";

export const HistoryPanel: React.FC = () => {
  const { isHistoryPanelOpen, toggleHistoryPanel } = useHistoryManager();

  return (
    <Dialog open={isHistoryPanelOpen} onOpenChange={toggleHistoryPanel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> History Panel (Modal Stub)
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-muted-foreground">
          This is a modal view of the History Panel, typically used for mobile or quick access.
        </div>
      </DialogContent>
    </Dialog>
  );
};