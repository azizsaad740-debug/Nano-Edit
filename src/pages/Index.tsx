import * as React from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace"; // Fix 186
import LeftSidebar from "@/components/layout/LeftSidebar";
import Sidebar, { RightSidebarTabsProps } from "@/components/layout/Sidebar";
import BottomPanel from "@/components/layout/BottomPanel";
// ... (dialog imports)
import { MobileToolBar } from "@/components/mobile/MobileToolBar";
import MobileToolOptions from "@/components/mobile/MobileToolOptions"; // Fix 187
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
// ... (rest of file)