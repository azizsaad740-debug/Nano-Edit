"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";

export interface TextLayerProps { // Exporting interface for Index.tsx
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  activeTool: ActiveTool | null;
  zoom: number;
  systemFonts: string[]; // Added
  customFonts: string[]; // Added
}

export const TextLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected, activeTool, zoom, systemFonts, customFonts }: TextLayerProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const editableRef = React.useRef<HTMLDivElement>(null);

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
    type: "text",
    activeTool,
    isSelected,
    zoom, // PASS ZOOM
  });

  // Editing logic
  const handleDoubleClick = () => {
    if (isSelected) setIsEditing(true);
  };

  const handleBlur = () => {
    if (editableRef.current) {
      // Normalize line breaks and trim content
      const newContent = editableRef.current.innerText.replace(/\n\s*\n/g, '\n').trim();
      onUpdate(layer.id, { content: newContent });
    }
    setIsEditing(false);
    onCommit(layer.id);
  };

  React.useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  if (!layer.visible || layer.type !== "text") return null;

  const getPositionTransform = () => {
    switch (layer.textAlign) {
      case 'left': return 'translate(0, -50%)';
      case 'right': return 'translate(-100%, -50%)';
      case 'center': default: return 'translate(-50%, -50%)';
    }
  };

  const style: React.CSSProperties = {
    color: layer.color,
    fontSize: `${layer.fontSize}px`,
    fontFamily: layer.fontFamily || 'Roboto',
    fontWeight: layer.fontWeight || 'normal',
    fontStyle: layer.fontStyle || 'normal',
    lineHeight: layer.lineHeight || 1.2, // Use lineHeight multiplier
    userSelect: isEditing ? "text" : "none",
    whiteSpace: "pre-wrap", // Allow wrapping and preserve whitespace/newlines
    opacity: (layer.opacity ?? 100) / 100,
    letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
    textAlign: layer.textAlign || 'center', // Apply text alignment
  };

  if (layer.textShadow) {
    const { offsetX, offsetY, blur, color } = layer.textShadow;
    style.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }

  if (layer.stroke) {
    const { width, color } = layer.stroke;
    style.WebkitTextStroke = `${width}px ${color}`;
    style.WebkitTextFillColor = layer.color;
  } else {
    style.WebkitTextFillColor = undefined;
  }

  const wrapperStyle: React.CSSProperties = {};
  if (layer.backgroundColor) {
    wrapperStyle.backgroundColor = layer.backgroundColor;
    wrapperStyle.padding = `${layer.padding || 0}px`;
    wrapperStyle.borderRadius = 'var(--radius)';
  }

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));

  return (
    <div
      ref={layerRef}
      onMouseDown={handleDragMouseDown}
      onDoubleClick={handleDoubleClick}
      className="absolute"
      style={{
        left: `${layer.x ?? 50}%`,
        top: `${layer.y ?? 50}%`,
        transform: `${getPositionTransform()} rotateZ(${layer.rotation || 0}deg)`,
        cursor: isEditing ? "text" : (isMovable ? "grab" : "default"),
        mixBlendMode: layer.blendMode as any || 'normal',
      }}
    >
      <div
        className={cn(
          "relative",
          isSelected && !isEditing && "outline outline-2 outline-primary outline-dashed"
        )}
        style={wrapperStyle}
      >
        {isEditing ? (
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            style={style}
            dangerouslySetInnerHTML={{ __html: layer.content || "" }}
          />
        ) : (
          <div style={style}>{layer.content}</div>
        )}

        {isSelected && !isEditing && (
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