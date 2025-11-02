"use client";

import * as React from "react";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { PencilOptions } from "@/components/editor/PencilOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import { PaintBucketOptions } from "@/components/editor/PaintBucketOptions";
import { StampOptions } from "@/components/editor/StampOptions";
import { HistoryBrushOptions } from "@/components/editor/HistoryBrushOptions";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions";
import { SelectionToolOptions } from "@/components/editor/SelectionToolOptions";
import { SharpenToolOptions } from "@/components/editor/SharpenToolOptions";
import Crop from "@/components/editor/Crop";
import type { ActiveTool, BrushState, SelectionSettings, GradientToolState, Point } from "@/types/editor";
import type { GradientPreset } from "@/hooks/useGradientPresets";
import { Label } from "@/components/ui/label";

export interface ToolOptionsContentProps {
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
  backgroundColor: string; // Needed for selection brush logic stub
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  selectiveSharpenAmount: number;
  onSelectiveSharpenAmountChange: (value: number) => void;
  onSelectiveSharpenAmountCommit: (value: number) => void;
  selectionSettings: SelectionSettings;
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  gradientPresets: GradientPreset[];
  onApplyGradientPreset: (preset: GradientPreset) => void;
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  cloneSourcePoint: Point | null;
  history: { name: string }[];
  historyBrushSourceIndex: number;
  setHistoryBrushSourceIndex: (index: number) => void;
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
}

export const ToolOptionsContent: React.FC<ToolOptionsContentProps> = (props) => {
  const {
    activeTool, brushState, setBrushState, foregroundColor, setForegroundColor,
    selectiveBlurAmount, onSelectiveBlurAmountChange, onSelectiveBlurAmountCommit,
    selectiveSharpenAmount, onSelectiveSharpenAmountChange, onSelectiveSharpenAmountCommit,
    selectionSettings, onSelectionSettingChange, onSelectionSettingCommit,
    gradientToolState, setGradientToolState, gradientPresets, onApplyGradientPreset,
    onSaveGradientPreset, onDeleteGradientPreset, cloneSourcePoint, history,
    historyBrushSourceIndex, setHistoryBrushSourceIndex, onAspectChange, aspect,
    backgroundColor,
  } = props;

  const isBrushTool = activeTool === 'brush';
  const isEraserTool = activeTool === 'eraser';
  const isPencilTool = activeTool === 'pencil';
  const isSelectionBrushTool = activeTool === 'selectionBrush';
  const isBlurBrushTool = activeTool === 'blurBrush';
  const isSharpenTool = activeTool === 'sharpenTool';
  const isStampTool = activeTool === 'cloneStamp' || activeTool === 'patternStamp';
  const isHistoryBrushTool = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
  const isGradientTool = activeTool === 'gradient';
  const isPaintBucketTool = activeTool === 'paintBucket';
  const isSelectionTool = activeTool?.includes('marquee') || activeTool?.includes('lasso') || activeTool?.includes('select') || activeTool === 'quickSelect' || activeTool === 'magicWand' || activeTool === 'objectSelect';
  const isCropTool = activeTool === 'crop';
  const isTransformTool = activeTool === 'move';

  // 1. Brush/Eraser/Pencil
  if (isBrushTool || isEraserTool) {
    return (
      <BrushOptions
        activeTool={isEraserTool ? 'eraser' : 'brush'}
        brushSize={brushState.size}
        setBrushSize={(size) => setBrushState({ size })}
        brushOpacity={brushState.opacity}
        setBrushOpacity={(opacity) => setBrushState({ opacity })}
        foregroundColor={foregroundColor}
        setForegroundColor={setForegroundColor}
        brushHardness={brushState.hardness}
        setBrushHardness={(hardness) => setBrushState({ hardness })}
        brushSmoothness={brushState.smoothness}
        setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
        brushShape={brushState.shape}
        setBrushShape={(shape) => setBrushState({ shape })}
        brushFlow={brushState.flow}
        setBrushFlow={(flow) => setBrushState({ flow })}
        brushAngle={brushState.angle}
        setBrushAngle={(angle) => setBrushState({ angle })}
        brushRoundness={brushState.roundness}
        setBrushRoundness={(roundness) => setBrushState({ roundness })}
        brushSpacing={brushState.spacing}
        setBrushSpacing={(spacing) => setBrushState({ spacing })}
        brushBlendMode={brushState.blendMode}
        setBrushBlendMode={(blendMode) => setBrushState({ blendMode })}
      />
    );
  }
  // 2. Pencil
  if (isPencilTool) {
    return (
      <PencilOptions
        brushState={brushState}
        setBrushState={setBrushState}
        foregroundColor={foregroundColor}
        setForegroundColor={setForegroundColor}
      />
    );
  }
  // 3. Selection/Blur Brush / Sharpen Tool
  if (isSelectionBrushTool || isBlurBrushTool) {
    return (
      <BlurBrushOptions
        selectiveBlurStrength={selectiveBlurAmount}
        onStrengthChange={onSelectiveBlurAmountChange}
        onStrengthCommit={onSelectiveBlurAmountCommit}
      />
    );
  }
  if (isSharpenTool) {
    return (
      <SharpenToolOptions
        selectiveSharpenStrength={selectiveSharpenAmount}
        onStrengthChange={onSelectiveSharpenAmountChange}
        onStrengthCommit={onSelectiveSharpenAmountCommit}
      />
    );
  }
  // 4. Stamp Tools
  if (isStampTool) {
    return <StampOptions cloneSourcePoint={cloneSourcePoint} />;
  }
  // 5. History Brush Tools
  if (isHistoryBrushTool) {
    return (
      <HistoryBrushOptions
        activeTool={activeTool as 'historyBrush' | 'artHistoryBrush'}
        history={history}
        brushSize={brushState.size}
        setBrushSize={(size) => setBrushState({ size })}
        brushOpacity={brushState.opacity}
        setBrushOpacity={(opacity) => setBrushState({ opacity })}
        brushFlow={brushState.flow}
        setBrushFlow={(flow) => setBrushState({ flow })}
        historyBrushSourceIndex={historyBrushSourceIndex}
        setHistoryBrushSourceIndex={setHistoryBrushSourceIndex}
      />
    );
  }
  // 6. Gradient Tool Defaults
  if (isGradientTool) {
    return (
      <GradientToolOptions
        gradientToolState={gradientToolState}
        setGradientToolState={setGradientToolState}
        gradientPresets={gradientPresets}
        onApplyGradientPreset={onApplyGradientPreset}
        onSaveGradientPreset={onSaveGradientPreset}
        onDeleteGradientPreset={onDeleteGradientPreset}
      />
    );
  }
  // 7. Paint Bucket
  if (isPaintBucketTool) {
    return <PaintBucketOptions />;
  }
  // 8. Selection Tools / Move Tool
  if (isSelectionTool || isTransformTool) {
    return (
      <SelectionToolOptions
        activeTool={activeTool}
        settings={selectionSettings}
        onSettingChange={onSelectionSettingChange}
        onSelectionSettingCommit={onSelectionSettingCommit}
      />
    );
  }
  // 9. Crop Tool
  if (isCropTool) {
    return (
      <div className="space-y-4">
        <Label className="text-md font-semibold">Crop Aspect Ratio</Label>
        <Crop onAspectChange={onAspectChange} currentAspect={aspect} />
      </div>
    );
  }
  // 10. Eyedropper
  if (activeTool === 'eyedropper') {
    return (
      <p className="text-sm text-muted-foreground">
        Eyedropper Tool is active. Click on the image to sample a color.
      </p>
    );
  }

  return null;
};