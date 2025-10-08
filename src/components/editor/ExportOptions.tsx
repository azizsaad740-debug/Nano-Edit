import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ExportOptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: { format: string; quality: number }) => void;
}

export const ExportOptions = ({ open, onOpenChange, onExport }: ExportOptionsProps) => {
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(90);

  const handleExport = () => {
    onExport({ format, quality: quality / 100 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
          <DialogDescription>
            Choose your desired format and quality settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WEBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(format === "jpeg" || format === "webp") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quality" className="text-right">
                Quality
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Slider
                  id="quality"
                  min={10}
                  max={100}
                  step={5}
                  value={[quality]}
                  onValueChange={([value]) => setQuality(value)}
                />
                <span className="w-10 text-right text-sm text-muted-foreground">{quality}%</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleExport}>Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};