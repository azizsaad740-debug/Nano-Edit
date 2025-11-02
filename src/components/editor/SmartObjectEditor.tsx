import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import type { Layer, ActiveTool, ShapeType } from "@/types/editor";
import { useSmartObjectLayers } from "@/hooks/useSmartObjectLayers"; // Fix 168
import { ToolsPanel } from "@/components/layout/ToolsPanel";
// ... (rest of file)