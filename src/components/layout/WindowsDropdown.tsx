"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, Check, ChevronDown } from "lucide-react";
import type { PanelTab } from "@/types/editor/core";

interface WindowsDropdownProps {
  panelLayout: PanelTab[];
  togglePanelVisibility: (id: string) => void;
  activeRightTab: string;
  setActiveRightTab: (id: string) => void;
  activeBottomTab: string;
  setActiveBottomTab: (id: string) => void;
}

export const WindowsDropdown: React.FC<WindowsDropdownProps> = ({
  panelLayout,
  togglePanelVisibility,
  activeRightTab,
  setActiveRightTab,
  activeBottomTab,
  setActiveBottomTab,
}) => {
  const handleToggle = (tab: PanelTab) => {
    togglePanelVisibility(tab.id);
    
    // If we hide the currently active tab, switch to the next visible one in that panel
    if (tab.visible) {
        const visibleTabsInPanel = panelLayout.filter(t => t.location === tab.location && t.id !== tab.id && t.visible);
        if (tab.location === 'right' && tab.id === activeRightTab && visibleTabsInPanel.length > 0) {
            // Find the next visible tab in the correct order
            const nextTab = visibleTabsInPanel.sort((a, b) => a.order - b.order)[0];
            setActiveRightTab(nextTab.id);
        }
        if (tab.location === 'bottom' && tab.id === activeBottomTab && visibleTabsInPanel.length > 0) {
            const nextTab = visibleTabsInPanel.sort((a, b) => a.order - b.order)[0];
            setActiveBottomTab(nextTab.id);
        }
    }
  };

  // Filter and sort tabs for display in the menu
  const sortedTabs = React.useMemo(() => {
    return panelLayout.slice().sort((a, b) => {
        // Group by location: Right, Bottom, Hidden (for display purposes)
        if (a.location === 'right' && b.location !== 'right') return -1;
        if (b.location === 'right' && a.location !== 'right') return 1;
        if (a.location === 'bottom' && b.location === 'hidden') return -1;
        if (b.location === 'bottom' && a.location === 'hidden') return 1;
        return a.order - b.order;
    });
  }, [panelLayout]);

  const rightTabs = sortedTabs.filter(t => t.location === 'right' || (t.location === 'hidden' && t.order < 6));
  const bottomTabs = sortedTabs.filter(t => t.location === 'bottom' || (t.location === 'hidden' && t.order >= 6));


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <LayoutGrid className="h-4 w-4" />
          Windows
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Right Sidebar Panels</DropdownMenuLabel>
        {rightTabs.map(tab => (
          <DropdownMenuItem key={tab.id} onClick={() => handleToggle(tab)}>
            {tab.visible ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2" />}
            {tab.name}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Bottom Panels</DropdownMenuLabel>
        {bottomTabs.map(tab => (
          <DropdownMenuItem key={tab.id} onClick={() => handleToggle(tab)}>
            {tab.visible ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2" />}
            {tab.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};