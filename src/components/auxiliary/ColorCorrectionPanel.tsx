import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Adjustments from "@/components/editor/Adjustments";
import ColorGrading from "@/components/editor/ColorGrading";
import HslAdjustments from "@/components/editor/HslAdjustments"; // Fix 141
import Curves from "@/components/editor/Curves"; // Fix 142
import type { EditState, HslAdjustment, Point } from "@/types/editor";
// ... (rest of file)