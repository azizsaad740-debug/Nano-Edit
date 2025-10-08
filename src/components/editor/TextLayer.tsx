"use client";

import * as React from "react";
import type { Layer } from "@/hooks/useEditorState";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";

interface TextLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
}

export const TextLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected }: TextLayerProps) => {
  const textRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const dragStartPos = React.useRef({ x: 0, y: 0 });
  const resizeStartInfo = React.useRef({
    x: 0,
    y: 0,
    fontSize: 48,
    handle: "",
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const editableRef = React.useRef<HTMLDivElement>(null);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing || !isSelected) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !textRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    const currentLeft = ((layer.x ?? 0) / 100) * containerRect.width;
    const currentTop = ((layer.y ?? 0) / 100) * containerRect.height;

    const newLeft = currentLeft + dx;
    const newTop = currentTop + dy;

    const newX = (newLeft / containerRect.width) * 100;
    const newY = (newTop / containerRect.height) * 100;

    onUpdate(layer.id, { x: newX, y: newY });
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, containerRef, layer.id, layer.x, layer.y, onUpdate]);

  const handleMouseUp = React.useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onCommit(layer.id);
    }
  }, [isDragging, layer.id, onCommit]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Resizing logic
  const handleResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handle: string
  ) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      fontSize: layer.fontSize || 48,
      handle,
    };
  };

  const handleResizeMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const dx = e.clientX - resizeStartInfo.current.x;
    const dy = e.clientY - resizeStartInfo.current.y;
    
    let change = 0;
    switch (resizeStartInfo.current.handle) {
      case "top-left":
        change = -(dx + dy);
        break;
      case "top-right":
        change = dx - dy;
        break;
      case "bottom-left":
        change = -dx + dy;
        break;
      case "bottom-right":
        change = dx + dy;
        break;
    }

    const newFontSize = Math.max(8, Math.round(resizeStartInfo.current.fontSize + (change * 0.5)));

    onUpdate(layer.id, { fontSize: newFontSize });
  }, [isResizing, layer.id, onUpdate]);

  const handleResizeMouseUp = React.useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onCommit(layer.id);
    }
  }, [isResizing, layer.id, onCommit]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  // Editing logic
  const handleDoubleClick = () => {
    if (isSelected) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (editableRef.current) {
      onUpdate(layer.id, { content: editableRef.current.innerText });
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

  if (!layer.visible || layer.type !== "text") {
    return null;
  }

  const getTransform = () => {
    switch (layer.textAlign) {
      case 'left':
        return 'translate(0, -50%)';
      case 'right':
        return 'translate(-100%, -50%)';
      case 'center':
      default:
        return 'translate(-50%, -50%)';
    }
  };

  const style = {
    color: layer.color,
    fontSize: `${layer.fontSize}px`,
    fontFamily: layer.fontFamily || 'Roboto',
    fontWeight: layer.fontWeight || 'normal',
    fontStyle: layer.fontStyle || 'normal',
    textShadow: "0 0 5px rgba(0,0,0,0.7)",
    userSelect: isEditing ? "text" : "none",
    whiteSpace: "nowrap",
    opacity: (layer.opacity ?? 100) / 100,
  } as React.CSSProperties;

  return (
    <div
      ref={textRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="absolute"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        transform: getTransform(),
        cursor: isSelected && !isEditing ? "move" : "default",
      }}
    >
      <div
        className={cn(
          "relative p-2",
          isSelected && !isEditing && "outline outline-2 outline-primary outline-dashed"
        )}
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
          </>
        )}
      </div>
    </div>
  );
};