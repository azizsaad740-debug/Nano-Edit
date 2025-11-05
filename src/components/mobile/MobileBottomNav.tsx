"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Settings, SlidersHorizontal, Palette, LayoutGrid, Brush, Home, Zap, Layers, History, PenTool, Info, Compass, SquareStack } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type MobileTab = 'layers' | 'properties' | 'adjustments' | 'color' | 'ai' | 'history' | 'channels' | 'brushes' | 'paths' | 'info' | 'navigator' | 'templates' | 'tools';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
}

const tabs: { name: string; icon: React.ElementType; tab: MobileTab }[] = [
  { name: "Layers", icon: Layers, tab: "layers" },
  { name: "Tools/Props", icon: Brush, tab: "properties" }, // Combines Tool Options and Layer Properties
  { name: "Adjustments", icon: SlidersHorizontal, tab: "adjustments" },
  { name: "Color", icon: Palette, tab: "color" },
  { name: "AI Tools", icon: Zap, tab: "ai" },
  { name: "History", icon: History, tab: "history" },
  { name: "Channels", icon: SquareStack, tab: "channels" },
  { name: "Brushes", icon: Brush, tab: "brushes" },
  { name: "Paths", icon: PenTool, tab: "paths" },
  { name: "Info", icon: Info, tab: "info" },
  { name: "Navigator", icon: Compass, tab: "navigator" },
  { name: "Templates", icon: LayoutGrid, tab: "templates" },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <footer className="w-full h-16 bg-background border-t border-border/50 flex shrink-0">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex h-full items-center justify-start space-x-1 p-1">
          {tabs.map(({ name, icon: Icon, tab }) => (
            <Button
              key={name}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col h-14 w-16 p-1 shrink-0 transition-all duration-150",
                activeTab === tab 
                  ? "text-primary bg-primary/10 border border-primary/50" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab(tab)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium truncate max-w-full">{name}</span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </footer>
  );
};