"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2 } from "lucide-react";

interface Layer {
  id: string;
  type: "image" | "text";
  name: string;
  visible: boolean;
  content?: string; // only for text layers
}

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onEditTextLayer: (id: string) => void;
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onEditTextLayer,
}: LayersPanelProps) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");

  const startRename = (layer: Layer) => {
    setEditingId(layer.id);
    setTempName(layer.name);
  };

  const confirmRename = (id: string) => {
    onRename(id, tempName.trim() || "Untitled");
    setEditingId(null);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Layers</CardTitle>
        <Button size="sm" onClick={onAddTextLayer}>
          Add Text
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center justify-between p-2 border rounded-md"
          >
            <div className="flex items-center gap-2">
              <Switch
                checked={layer.visible}
                onCheckedChange={() => onToggleVisibility(layer.id)}
              />
              {editingId === layer.id ? (
                <Input
                  className="w-32"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => confirmRename(layer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename(layer.id);
                  }}
                  autoFocus
                />
              ) : (
                <span className="font-medium">{layer.name}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {layer.type === "text" && (
                <Button variant="ghost" size="icon" onClick={() => onEditTextLayer(layer.id)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => startRename(layer)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(layer.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};