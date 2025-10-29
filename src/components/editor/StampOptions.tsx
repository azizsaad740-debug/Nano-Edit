import * as React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Image, Plus, Target } from "lucide-react";
import { showError } from "@/utils/toast";
import type { Point } from "@/types/editor";

interface StampOptionsProps {
  cloneSourcePoint: Point | null;
}

export const StampOptions: React.FC<StampOptionsProps> = ({ cloneSourcePoint }) => {
  const [aligned, setAligned] = React.useState(true);
  const [impressionist, setImpressionist] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="pattern-selector">Pattern</Label>
        <div className="flex items-center gap-2">
          <Select defaultValue="default-pattern">
            <SelectTrigger id="pattern-selector">
              <SelectValue placeholder="Select Pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default-pattern">Default Texture</SelectItem>
              <SelectItem value="wood">Wood Grain</SelectItem>
              <SelectItem value="marble">Marble</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" onClick={() => showError("Pattern creation is a stub.")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Separator />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="aligned"
          checked={aligned}
          onCheckedChange={(checked) => { 
            if (typeof checked === 'boolean') {
              setAligned(checked);
            }
          }}
        />
        <Label htmlFor="aligned" className="text-sm font-medium leading-none">
          Aligned
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="impressionist"
          checked={impressionist}
          onCheckedChange={(checked) => { 
            if (typeof checked === 'boolean') {
              setImpressionist(checked);
            }
          }}
        />
        <Label htmlFor="impressionist" className="text-sm font-medium leading-none">
          Impressionist (Stub)
        </Label>
      </div>
      
      <Separator />
      
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Clone Source (Stub)</Label>
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {cloneSourcePoint 
                ? `X: ${Math.round(cloneSourcePoint.x)}, Y: ${Math.round(cloneSourcePoint.y)}`
                : "Not set (Alt + Click)"
              }
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => showError("Set clone source is a stub.")}>
            <Image className="h-4 w-4 mr-2" /> Set Source
          </Button>
        </div>
      </div>
    </div>
  );
};