"use client";

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { showError } from '@/utils/toast';

const exportSchema = z.object({
  filename: z.string().min(1, "Filename is required."),
  format: z.enum(["png", "jpeg", "webp"]),
  quality: z.number().min(1).max(100),
});

type ExportFormValues = z.infer<typeof exportSchema>;

interface ExportOptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportFormValues) => void;
  dimensions: { width: number; height: number } | null;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ open, onOpenChange, onExport, dimensions }) => {
  const defaultFilename = "nanoedit_export";
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      filename: defaultFilename,
      format: "png",
      quality: 90,
    },
  });

  const format = watch("format");
  const quality = watch("quality");
  const isQualityVisible = format === 'jpeg' || format === 'webp';

  const onSubmit = (data: ExportFormValues) => {
    if (!dimensions) {
      showError("Cannot export: No image loaded.");
      return;
    }
    onExport(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
          <DialogDescription>
            Choose your export format and quality settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          
          {/* Filename */}
          <div className="grid gap-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              placeholder={defaultFilename}
              {...register("filename")}
            />
            {errors.filename && <p className="text-sm text-destructive">{errors.filename.message}</p>}
          </div>

          {/* Format */}
          <div className="grid gap-2">
            <Label htmlFor="format">Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setValue("format", value as ExportFormValues['format'])}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless, supports transparency)</SelectItem>
                <SelectItem value="jpeg">JPEG (Lossy, no transparency)</SelectItem>
                <SelectItem value="webp">WEBP (Modern, supports transparency & compression)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality Slider */}
          {isQualityVisible && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality">Quality</Label>
                <span className="w-10 text-right text-sm text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                id="quality"
                min={1}
                max={100}
                step={1}
                value={[quality]}
                onValueChange={([value]) => setValue("quality", value)}
                onValueCommit={([value]) => setValue("quality", value)}
              />
            </div>
          )}
          
          {dimensions && (
            <p className="text-sm text-muted-foreground mt-2">
              Exporting {dimensions.width} x {dimensions.height} pixels.
            </p>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};