"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRightLeft, Palette, Droplet, LayoutGrid, RotateCcw } from "lucide-react";
import { ColorTool } from "@/components/layout/ColorTool";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";

interface ColorPanelProps {
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
}

const defaultSwatches = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#808000', '#800080', '#008000',
];

const ColorPanel: React.FC<ColorPanelProps> = ({
  foregroundColor,
  onForegroundColorChange,
  backgroundColor,
  onBackgroundColorChange,
  onSwapColors,
}) => {
  const [hexInput, setHexInput] = React.useState(foregroundColor);
  const [colorMode, setColorMode] = React.useState<'hex' | 'rgb' | 'hsb'>('hex');

  React.useEffect(() => {
    setHexInput(foregroundColor);
  }, [foregroundColor]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value.toUpperCase();
    setHexInput(newHex);
    if (/^#([0-9A-F]{3}){1,2}$/.test(newHex)) {
      onForegroundColorChange(newHex);
    }
  };

  const handleSwatchSelect = (color: string) => {
    onForegroundColorChange(color);
  };
  
  const handleResetDefaults = () => {
    onForegroundColorChange('#000000');
    onBackgroundColorChange('#FFFFFF');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ColorTool
          foregroundColor={foregroundColor}
          onForegroundColorChange={onForegroundColorChange}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={onBackgroundColorChange}
          onSwapColors={onSwapColors}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="hex-input" className="text-sm">Foreground Color</Label>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleResetDefaults}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
          <Input
            id="hex-input"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#RRGGBB"
            className="h-8 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {colorMode === 'hex' && `HEX: ${foregroundColor}`}
            {colorMode === 'rgb' && `RGB: (Stub)`}
            {colorMode === 'hsb' && `HSB: (Stub)`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="swatches" className="w-full">
        <TabsList className="w-full h-8">
          <TabsTrigger value="swatches" className="h-6 flex-1 text-xs">
            <Palette className="h-3 w-3 mr-1" /> Swatches
          </TabsTrigger>
          <TabsTrigger value="harmony" className="h-6 flex-1 text-xs">
            <LayoutGrid className="h-3 w-3 mr-1" /> Harmony
          </TabsTrigger>
          <TabsTrigger value="libraries" className="h-6 flex-1 text-xs">
            <Droplet className="h-3 w-3 mr-1" /> Libraries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swatches" className="mt-2">
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="grid grid-cols-8 gap-1">
              {defaultSwatches.map((color) => (
                <div
                  key={color}
                  className={cn(
                    "w-full aspect-square rounded-sm cursor-pointer border border-border transition-transform hover:scale-110",
                    foregroundColor === color && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSwatchSelect(color)}
                />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => showError("Custom palette saving is a stub.")}>
                Save Custom Palette (Stub)
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="harmony" className="mt-2">
          <div className="space-y-2 p-2 border rounded-md">
            <h4 className="text-sm font-medium">Color Harmony (Stub)</h4>
            <p className="text-xs text-muted-foreground">
              Analogous, Complementary, Triad, Tetrad, Tetrad, Split complementary generation is not yet implemented.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="libraries" className="mt-2">
          <div className="space-y-2 p-2 border rounded-md">
            <h4 className="text-sm font-medium">Color Libraries (Stub)</h4>
            <p className="text-xs text-muted-foreground">
              Pantone, Web colors, Material Design integration is not yet implemented.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ColorPanel;