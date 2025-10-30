"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Settings, SlidersHorizontal, Palette, LayoutGrid, Brush, Home, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileTab = 'tools' | 'properties' | 'adjustments' | 'color' | 'ai';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
}

const tabs: { name: string; icon: React.ElementType; tab: MobileTab }[] = [
  { name: "Tools", icon: Brush, tab: "tools" },
  { name: "Properties", icon: Home, tab: "properties" },
  { name: "Adjustments", icon: SlidersHorizontal, tab: "adjustments" },
  { name: "Color", icon: Palette, tab: "color" },
  { name: "AI Tools", icon: Zap, tab: "ai" },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <footer className="w-full h-20 bg-background border-t border-border/50 flex justify-around items-center shrink-0">
      {tabs.map(({ name, icon: Icon, tab }) => (
        <Button
          key={name}
          variant="ghost"
          size="sm"
          className={cn(
            "flex flex-col h-full w-1/5 p-1 rounded-none",
            activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab(tab)}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{name}</span>
        </Button>
      ))}
    </footer>
  );
};