"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/hooks/useEditorState"; // Import ActiveTool
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { cn } from "@/lib/utils";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import GroupLayer from "./GroupLayer"; // Import GroupLayer
import GradientLayer from "./GradientLayer"; // Import GradientLayer

interface SmartObjectWorkspaceProps {
  layers: Layer[];
  width: number;
  height: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  mainImage: string | null;
  activeTool: ActiveTool | null; // Added activeTool prop
}

export const SmartObjectWorkspace = ({
  layers,
  width,
  height,
  selectedLayerId,
  onSelectLayer,
  onLayerUpdate,
  onLayerCommit,
  mainImage,
  activeTool, // Destructure activeTool
}: SmartObjectWorkspaceProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = React.useState(1);

  // --- SCALING LOGIC ---
  const calculateScale = React.useCallback(() => {
    const container = containerRef.current?.parentElement; // Measure the parent div (the flex-1 container)
    if (!container || width === 0 || height === 0) return;

    // Use clientWidth/Height of the parent container to determine available space
    const availableWidth = container.clientWidth;
    const availableHeight = container.clientHeight;

    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    
    // We want to fit the content, and never upscale beyond 1x
    const newScale = Math.min(scaleX, scaleY, 1); 
    
    if (newScale !== scaleFactor) {
      setScaleFactor(newScale);
    }
  }, [width, height, scaleFactor]);

  React.useEffect(() => {
    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    // Use a MutationObserver to detect size changes in the parent container 
    // (e.g., when ResizablePanel is dragged)
    const observer = new MutationObserver(calculateScale);
    if (containerRef.current?.parentElement) {
        observer.observe(containerRef.current.parentElement, { attributes: true, childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('resize', calculateScale);
      observer.disconnect();
    };
  }, [calculateScale]);
  // --- END SCALING LOGIC ---

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect if clicking on the workspace background
    if (e.target === containerRef.current) {
      onSelectLayer(null);
    }
  };

  const backgroundStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    aspectRatio: width / height,
    
    // Apply scaling to the outer container to center it correctly
    transform: `scale(${scaleFactor})`,
    transformOrigin: 'center center',
    
    // Checkerboard effect for transparency if no main image
    backgroundImage: mainImage 
      ? `url(${mainImage})` 
      : 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
    backgroundSize: mainImage ? 'contain' : '20px 20px',
    backgroundRepeat: mainImage ? 'no-repeat' : 'repeat',
    backgroundPosition: mainImage ? 'center' : '0 0, 0 10px, 10px -10px, -10px 0px',
  };

  const parentDimensions = { width, height }; // Dimensions of this smart object's canvas

  const renderWorkspaceLayers = (layersToRender: Layer[]) => {
    return layersToRender.map((layer) => {
      if (!layer.visible) return null;
      
      const layerProps = {
        key: layer.id,
        layer: layer,
        containerRef: containerRef,
        onUpdate: onLayerUpdate,
        onCommit: onLayerCommit,
        isSelected: layer.id === selectedLayerId,
        activeTool: activeTool,
      };

      if (layer.type === 'text') {
        return <TextLayer {...layerProps} />;
      }
      if (layer.type === 'drawing' && layer.dataUrl) {
        return <DrawingLayer key={layer.id} layer={layer} />;
      }
      if (layer.type === 'smart-object') {
        return <SmartObjectLayer {...layerProps} parentDimensions={parentDimensions} />;
      }
      if (layer.type === 'vector-shape') {
        return <VectorShapeLayer {...layerProps} />;
      }
      if (layer.type === 'gradient') {
        return <GradientLayer {...layerProps} imageNaturalDimensions={parentDimensions} />;
      }
      if (layer.type === 'group') {
        return <GroupLayer 
          {...layerProps} 
          parentDimensions={parentDimensions} 
          renderChildren={renderWorkspaceLayers} 
          globalSelectedLayerId={selectedLayerId} 
        />;
      }
      return null;
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden border rounded-md bg-muted",
      )}
      style={backgroundStyle}
      onClick={handleClick}
    >
      <div
        className="relative"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {renderWorkspaceLayers(layers)}
      </div>
    </div>
  );
};