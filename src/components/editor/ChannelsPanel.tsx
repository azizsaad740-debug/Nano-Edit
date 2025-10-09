"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { EditState } from "@/hooks/useEditorState";

interface ChannelsPanelProps {
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
}

export const ChannelsPanel = ({ channels, onChannelChange }: ChannelsPanelProps) => {
  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <Label htmlFor="red-channel" className="font-medium">Red</Label>
        <Switch
          id="red-channel"
          checked={channels.r}
          onCheckedChange={(checked) => onChannelChange('r', checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="green-channel" className="font-medium">Green</Label>
        <Switch
          id="green-channel"
          checked={channels.g}
          onCheckedChange={(checked) => onChannelChange('g', checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="blue-channel" className="font-medium">Blue</Label>
        <Switch
          id="blue-channel"
          checked={channels.b}
          onCheckedChange={(checked) => onChannelChange('b', checked)}
        />
      </div>
    </div>
  );
};