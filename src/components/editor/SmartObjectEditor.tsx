import React from 'react';
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import SmartObjectLayersPanel from "./SmartObjectLayersPanel";
import { useSmartObjectLayers } from "@/hooks/useSmartObjectLayers";
import type { Layer, ActiveTool, BrushState } from "@/types/editor";

interface SmartObjectEditorProps {
  smartObject: Layer;
  onClose: () => void;
  onSave: (layers: Layer[]) => void;
  mainImage: string | null;
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  selectedShapeType: Layer['shapeType'] | null;
  setSelectedShapeType: (type: Layer['shapeType'] | null) => void;
  imgRef: React.RefObject<HTMLImageElement>;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

const SmartObjectEditor: React.FC<SmartObjectEditorProps> = ({ smartObject, onClose, onSave, mainImage, activeTool, setActiveTool, foregroundColor, backgroundColor, selectedShapeType }) => {
  
  const initialLayers = smartObject.smartObjectData?.layers || [];
  const smartObjectDimensions = { 
    width: smartObject.smartObjectData?.width || 1000, 
    height: smartObject.smartObjectData?.height || 1000 
  };

  // Placeholder implementation for useSmartObjectLayers arguments
  const { 
    layers, 
    selectedLayerId, 
    setSelectedLayerId, 
    handleLayerUpdate, 
    handleLayerCommit,
  } = useSmartObjectLayers({
    initialLayers,
    smartObjectDimensions,
    foregroundColor,
    backgroundColor,
    selectedShapeType,
  });

  return (
    <div className="flex h-full w-full">
      {/* Layers Panel (Left Sidebar) */}
      <div className="w-64 h-full border-r">
        <SmartObjectLayersPanel />
      </div>

      {/* Workspace (Center) */}
      <div className="flex-grow h-full">
        <SmartObjectWorkspace 
          layers={layers} 
          width={smartObjectDimensions.width}
          height={smartObjectDimensions.height}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
          mainImage={mainImage}
          activeTool={activeTool}
        />
      </div>
    </div>
  );
};

export default SmartObjectEditor;