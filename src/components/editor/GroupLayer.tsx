"use client";

import * as React from "react";
import type { Layer, ActiveTool, GroupLayerData, SmartObjectLayerData, GradientLayerData } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import GradientLayer from "./GradientLayer";

interface GroupLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  parentDimensions: { width: number; height: number } | null;
  activeTool: ActiveTool | null;
  renderChildren: (layer: Layer) => JSX.Element | null; // Updated signature
  globalSelectedLayerId: string | null; // New prop to track global selection
  zoom: number;
  // ADDED:
  setSelectedLayerId: (id: string | null) => void;
}

const GroupLayer = ({
  layer,
  containerRef,
  onUpdate,
  onCommit,
  isSelected,
  parentDimensions,
  activeTool,
  renderChildren,
  globalSelectedLayerId,
  zoom,
  setSelectedLayerId, // DESTRUCTURED
}: GroupLayerProps) => {
  const groupLayer = layer as GroupLayerData;

  const {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
  } = useLayerTransform({
    layer,
    containerRef,
    onUpdate,
    onCommit,
    type: "group", // Specify type as 'group'
    parentDimensions,
    activeTool,
    isSelected,
    zoom,
    setSelectedLayerId, // PASSED
  });

  if (!groupLayer.visible || groupLayer.type !== "group" || !groupLayer.children || !parentDimensions) return null;

  const currentWidthPercent = groupLayer.width ?? 100;
  const currentHeightPercent = groupLayer.height ?? 100;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));

  const style: React.CSSProperties = {
    left: `${groupLayer.x ?? 50}%`,
    top: `${groupLayer.y ?? 50}%`,
    width: `${currentWidthPercent}%`,
    height: `${currentHeightPercent}%`,
    transform: `translate(-50%, -50%) rotateZ(${groupLayer.rotation || 0}deg) scaleX(${groupLayer.scaleX ?? 1}) scaleY(${groupLayer.scaleY ?? 1})`,
    opacity: (groupLayer.opacity ?? 100) / 100,
    mixBlendMode: groupLayer.blendMode as any || 'normal',
    cursor: isMovable ? "grab" : "default",
    // Outline for debugging group bounds
    // outline: isSelected ? '1px dashed red' : 'none',
  };

  // Render children relative to the group's bounding box
  const childrenStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // Children's x, y, width, height are already relative to the group's dimensions
    // So we don't need to apply additional transforms here, they will be handled by their own components
  };

  return (
    <div
      ref={layerRef}
      onMouseDown={handleDragMouseDown}
      className="absolute"
      style={style}
    >
      <div
        className={cn(
          "relative w-full h-full",
          isSelected && "outline outline-2 outline-primary outline-dashed"
        )}
      >
        <div style={childrenStyle}>
          {/* Recursively render children layers */}
          {groupLayer.children.map(child => {
            // Props wrapper for nested layers
            const childProps = {
              key: child.id,
              layer: child,
              containerRef: layerRef, // The group's div is the container for its children
              onUpdate: (id: string, updates: Partial<Layer>) => {
                // This update needs to go up to the parent useLayers hook
                // to modify the children array of this group layer
                onUpdate(groupLayer.id, {
                  children: groupLayer.children?.map(c => c.id === id ? { ...c, ...updates } : c) as Layer[]
                });
              },
              onCommit: (id: string) => {
                onCommit(groupLayer.id); // Commit the group layer when a child is committed
              },
              isSelected: globalSelectedLayerId === child.id, // Use globalSelectedLayerId for highlighting
              activeTool: activeTool,
              zoom: zoom,
              setSelectedLayerId: setSelectedLayerId, // PASSED
            };

            if (!child.visible) return null;

            if (child.type === 'text') {
              return <TextLayer {...childProps} />;
            }
            if (child.type === 'drawing') {
              return <DrawingLayer {...childProps} />;
            }
            if (child.type === 'smart-object') {
              return <SmartObjectLayer {...childProps} parentDimensions={{ width: groupLayer.width ?? 100, height: groupLayer.height ?? 100 }} />;
            }
            if (child.type === 'vector-shape') {
              return <VectorShapeLayer {...childProps} />;
            }
            if (child.type === 'gradient') {
              return <GradientLayer {...childProps} imageNaturalDimensions={{ width: groupLayer.width ?? 100, height: groupLayer.height ?? 100 }} />;
            }
            // If a group contains another group, render it recursively
            if (child.type === 'group') {
              return <GroupLayer {...childProps} parentDimensions={{ width: groupLayer.width ?? 100, height: groupLayer.height ?? 100 }} renderChildren={renderChildren} globalSelectedLayerId={globalSelectedLayerId} />;
            }
            return null;
          })}
        </div>

        {isSelected && (
          <>
            <ResizeHandle position="top-left" onMouseDown={handleResizeMouseDown} />
            <ResizeHandle position="top-right" onMouseDown={handleResizeMouseDown} />
            <ResizeHandle position="bottom-left" onMouseDown={handleResizeMouseDown} />
            <ResizeHandle position="bottom-right" onMouseDown={handleResizeMouseDown} />
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4 h-8 cursor-[grab] flex items-end justify-center"
              onMouseDown={handleRotateMouseDown}
            >
              <RotateCw className="w-4 h-4 text-primary bg-background rounded-full p-0.5" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupLayer;