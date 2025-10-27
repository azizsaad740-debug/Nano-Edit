import React from 'react';
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import SmartObjectLayersPanel from "./SmartObjectLayersPanel"; // Fixed import
import { useSmartObjectLayers } from "@/hooks/useSmartObjectLayers";

const SmartObjectEditor: React.FC = () => {
  const { layers } = useSmartObjectLayers();

  return (
    <div className="flex h-full w-full">
      {/* Layers Panel (Left Sidebar) */}
      <div className="w-64 h-full border-r">
        <SmartObjectLayersPanel />
      </div>

      {/* Workspace (Center) */}
      <div className="flex-grow h-full">
        <SmartObjectWorkspace layers={layers} />
      </div>
    </div>
  );
};

export default SmartObjectEditor;