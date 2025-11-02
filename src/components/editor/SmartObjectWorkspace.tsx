"use client";

import * as React from "react";
import type { Layer, ActiveTool, SmartObjectLayerData, GroupLayerData } from "@/types/editor";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import GradientLayer from "./GradientLayer";
import GroupLayer from "./GroupLayer";

interface SmartObjectWorkspaceProps {
// ... (interface unchanged)
}

export const SmartObjectWorkspace: React.FC<SmartObjectWorkspaceProps> = (props) => { // FIXED: Ensure named export is used
  const {
// ... (rest of file unchanged)