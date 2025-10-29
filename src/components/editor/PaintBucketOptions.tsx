import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox"; // FIX 205, 208, 211
import { Separator } from "@/components/ui/separator";

interface PaintBucketOptionsProps {
  // Placeholder props for settings
}

export const PaintBucketOptions: React.FC<PaintBucketOptionsProps> = () => {
  const [tolerance, setTolerance] = React.useState(32);
  const [contiguous, setContiguous] = React.useState(true);
  const [antiAlias, setAntiAlias] = React.useState(true);
  const [allLayers, setAllLayers] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="tolerance">Tolerance</Label>
          <span className="w-10 text-right text-sm text-muted-foreground">{tolerance}</span>
        </div>
        <Slider
          id="tolerance"
          min={0}
          max={255}
          step={1}
          value={[tolerance]}
          onValueChange={([v]) => setTolerance(v)}
        />
      </div>
      
      <Separator />

      <div className="flex items-center space-x-2"> {/* FIX 1 */}
        <Checkbox
          id="contiguous"
          checked={contiguous}
          onCheckedChange={(checked) => { 
            if (typeof checked === 'boolean') {
              setContiguous(checked);
            }
          }}
        />
        <Label htmlFor="contiguous" className="text-sm font-medium leading-none">
          Contiguous
        </Label>
      </div> {/* FIX 4 */}
      
      <div className="flex items-center space-x-2"> {/* FIX 2 */}
        <Checkbox
          id="anti-alias"
          checked={antiAlias}
          onCheckedChange={(checked) => { 
            if (typeof checked === 'boolean') {
              setAntiAlias(checked);
            }
          }}
        />
        <Label htmlFor="anti-alias" className="text-sm font-medium leading-none">
          Anti-alias
        </Label>
      </div>
      
      <div className="flex items-center space-x-2"> {/* FIX 3 */}
        <Checkbox
          id="all-layers"
          checked={allLayers}
          onCheckedChange={(checked) => { 
            if (typeof checked === 'boolean') {
              setAllLayers(checked);
            }
          }}
        />
        <Label htmlFor="all-layers" className="text-sm font-medium leading-none">
          All Layers (Sample)
        </Label>
      </div>
    </div>
  );
};