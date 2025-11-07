"use client";

import * as React from "react";
import type { Layer, ActiveTool, TextLayerData } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";

export interface TextLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string, historyName: string) => void;
  isSelected: boolean;
  activeTool: ActiveTool | null;
  zoom: number;
  // ADDED:
  setSelectedLayerId: (id: string | null) => void;
}

export const TextLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected, activeTool, zoom, setSelectedLayerId }: TextLayerProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const editableRef = React.useRef<HTMLDivElement>(null);
  const textLayer = layer as TextLayerData;

  const {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
  } = useLayerTransform({
    layer,
    containerRef,
    onUpdate,
    onCommit: (id) => onCommit(id, `Update ${layer.name} Transform`),
    type: "text",
    activeTool,
    isSelected,
    zoom,
    setSelectedLayerId, // PASSED
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
    onCommit(layer.id, `Edit Text Content`);
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
    switch (textLayer.textAlign) {
      case 'left': return 'translate(0, -50%)';
      case 'right': return 'translate(-100%, -50%)';
      case 'center': default: return 'translate(-50%, -50%)';
    }
  };

  const style: React.CSSProperties = {
    color: textLayer.color,
    fontSize: `${textLayer.fontSize}px`,
    fontFamily: textLayer.fontFamily || 'Roboto',
    fontWeight: textLayer.fontWeight || 'normal',
    fontStyle: textLayer.fontStyle || 'normal',
    lineHeight: textLayer.lineHeight || 1.2, // Use lineHeight multiplier
    userSelect: isEditing ? "text" : "none",
    whiteSpace: "pre-wrap", // Allow wrapping and preserve whitespace/newlines
    opacity: (textLayer.opacity ?? 100) / 100,
    letterSpacing: textLayer.letterSpacing ? `${textLayer.letterSpacing}px` : undefined,
    textAlign: textLayer.textAlign || 'center', // Apply text alignment
  };

  if (textLayer.textShadow) {
    const { offsetX, offsetY, blur, color } = textLayer.textShadow;
    style.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }

  if (textLayer.stroke) {
    const { width, color } = textLayer.stroke;
    style.WebkitTextStroke = `${width}px ${color}`;
    style.WebkitTextFillColor = textLayer.color;
  } else {
    style.WebkitTextFillColor = undefined;
  }

  const wrapperStyle: React.CSSProperties = {};
  if (textLayer.backgroundColor) {
    wrapperStyle.backgroundColor = textLayer.backgroundColor;
    wrapperStyle.padding = `${textLayer.padding || 0}px`;
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
        left: `${textLayer.x ?? 50}%`,
        top: `${textLayer.y ?? 50}%`,
        transform: `${getPositionTransform()} rotateZ(${textLayer.rotation || 0}deg) scaleX(${textLayer.scaleX ?? 1}) scaleY(${textLayer.scaleY ?? 1})`,
        cursor: isEditing ? "text" : (isMovable ? "grab" : "default"),
        mixBlendMode: textLayer.blendMode as any || 'normal',
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
            dangerouslySetInnerHTML={{ __html: textLayer.content || "" }}
          />
        ) : (
          <div style={style}>{textLayer.content}</div>
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