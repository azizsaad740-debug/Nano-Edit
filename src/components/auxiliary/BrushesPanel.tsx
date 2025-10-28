"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brush, Settings, UploadCloud, Save, Trash2 } from "lucide-react";
import { showError } from "@/utils/toast";

const mockBrushPresets = [
  { name: "Soft Round", type: "circle", size: 20, hardness: 0 },
  { name: "Hard Round", type: "circle", size: 10, hardness: 100 },
  { name: "Square Chalk", type: "square", size: 30, hardness: 80 },
  { name: "Airbrush", type: "circle", size: 50, hardness: 0, opacity: 50 },
];

interface BrushesPanelProps {
  brushState: any; // Full brush state
  setBrushState: (updates: Partial<any>) => void;
}

const BrushesPanel: React.FC<BrushesPanelProps> = ({ brushState, setBrushState }) => {
  const handleApplyPreset = (preset: typeof mockBrushPresets[0]) => {
    setBrushState({ 
      size: preset.size, 
      hardness: preset.hardness, 
      shape: preset.type,
      opacity: preset.opacity ?? 100,
    });
    showError(`Applied brush preset: ${preset.name} (Stub: Opacity/Hardness applied to brushStateInternal)`);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="w-full h-8">
          <TabsTrigger value="presets" className="h-6 flex-1 text-xs">
            <Brush className="h-3 w-3 mr-1" /> Presets
          </TabsTrigger>
          <TabsTrigger value="settings" className="h-6 flex-1 text-xs">
            <Settings className="h-3 w-3 mr-1" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Brush Presets</h4>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => showError("Brush import is a stub.")}>
                <UploadCloud className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => showError("Brush save is a stub.")}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-40 border rounded-md p-2">
            <div className="space-y-1">
              {mockBrushPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleApplyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="mt-2">
          <div className="space-y-4 p-2 border rounded-md">
            <h4 className="text-sm font-medium">Shape Dynamics (Stub)</h4>
            <p className="text-xs text-muted-foreground">
              Shape dynamics, scattering, texture, dual brush, color dynamics, and transfer controls are not yet implemented.
            </p>
            <div className="grid gap-2">
              <h4 className="text-sm font-medium">Pressure Sensitivity</h4>
              <Button variant="outline" size="sm" onClick={() => showError("Pressure mapping is a stub.")}>
                Map Size to Pressure (Stub)
              </Button>
              <Button variant="outline" size="sm" onClick={() => showError("Pressure mapping is a stub.")}>
                Map Opacity to Pressure (Stub)
              </Button>
            </div>
            <div className="grid gap-2">
              <h4 className="text-sm font-medium">Brush Creator</h4>
              <Button variant="outline" size="sm" onClick={() => showError("Brush creator is a stub.")}>
                Create Custom Brush (Stub)
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrushesPanel;