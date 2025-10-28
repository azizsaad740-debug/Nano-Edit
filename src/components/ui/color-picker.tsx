"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onCommit: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onCommit }) => {
  const [localColor, setLocalColor] = React.useState(color);

  React.useEffect(() => {
    setLocalColor(color);
  }, [color]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalColor(e.target.value);
    onChange(e.target.value);
  };

  const handleCommit = () => {
    onCommit();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal h-9 p-1"
          style={{ backgroundColor: color }}
        >
          <div className={cn("w-full h-full rounded-sm border border-foreground/20")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <Input
          type="color"
          value={localColor}
          onChange={handleLocalChange}
          onBlur={handleCommit}
          className="w-full h-10 p-0 border-none"
        />
        <Input
          type="text"
          value={localColor}
          onChange={handleLocalChange}
          onBlur={handleCommit}
          className="mt-2 text-xs h-8"
        />
      </PopoverContent>
    </Popover>
  );
};