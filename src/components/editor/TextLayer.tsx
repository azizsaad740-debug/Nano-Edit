"use client";

import * as React from "react";
import type { Layer } from "@/hooks/useEditorState";

interface TextLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
}

export const TextLayer = ({ layer, containerRef, onUpdate, onCommit }: TextLayerProps) => {
  const textRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartPos = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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

  if (!layer.visible || layer.type !== "text") {
    return null;
  }

  return (
    <div
      ref={textRef}
      onMouseDown={handleMouseDown}
      className="absolute cursor-move p-2"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        transform: "translate(-50%, -50%)",
        color: layer.color,
        fontSize: `${layer.fontSize}px`,
        textShadow: "0 0 5px rgba(0,0,0,0.7)",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {layer.content}
    </div>
  );
};