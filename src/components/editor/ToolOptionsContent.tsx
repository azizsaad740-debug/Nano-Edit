import React from 'react';
import { BrushOptions } from './BrushOptions';
import { GradientToolOptions } from './GradientToolOptions';
import { SelectionToolOptions } from './SelectionToolOptions';
import { TextOptions } from './TextOptions';
import ShapeOptions from './ShapeOptions';
import { PencilOptions } from './PencilOptions';
import { StampOptions } from './StampOptions';
import { PaintBucketOptions } from './PaintBucketOptions';
import { BlurBrushOptions } from './BlurBrushOptions';
import { SharpenToolOptions } from './SharpenToolOptions';
import { HistoryBrushOptions } from './HistoryBrushOptions';
import type { ActiveTool, BrushState, SelectionSettings, GradientToolState, Point, BlendMode } from '@/types/editor';
import type { GradientPreset } from '@/hooks/useGradientPresets';

interface ToolOptionsContentProps {
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  onBrushCommit: () => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  gradientPresets: GradientPreset[];
  onApplyGradientPreset: (preset: GradientPreset) => void;
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  selectiveSharpenAmount: number;
  onSelectiveSharpenAmountChange: (value: number) => void;
  onSelectiveSharpenAmountCommit: (value: number) => void;
  cloneSourcePoint: Point | null;
  selectionSettings: SelectionSettings;
  handleCheckboxChange: (key: keyof SelectionSettings, value: boolean) => void;
  handleValueChange: (key: keyof SelectionSettings, value: number) => void;
  handleValueCommit: (key: keyof SelectionSettings, value: number) => void;
  history: { name: string }[];
  historyBrushSourceIndex: number;
  setHistoryBrushSourceIndex: (index: number) => void;
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
}

export const ToolOptionsContent: React.FC<ToolOptionsContentProps> = (props) => {
  const { activeTool, brushState, setBrushState, onBrushCommit, selectionSettings, handleCheckboxChange, handleValueChange, handleValueCommit } = props;

  const isBrushTool = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush' || activeTool === 'blurBrush' || activeTool === 'sharpenTool';
  const isPencilTool = activeTool === 'pencil';
  const isGradientTool = activeTool === 'gradient';
  const isSelectionTool = activeTool === 'marqueeRect' || activeTool === 'marqueeEllipse' || activeTool === 'lasso' || activeTool === 'lassoPoly' || activeTool === 'quickSelect' || activeTool === 'magicWand' || activeTool === 'objectSelect' || activeTool === 'lassoMagnetic';
  const isStampTool = activeTool === 'cloneStamp' || activeTool === 'patternStamp';
  const isPaintBucketTool = activeTool === 'paintBucket';
  const isBlurBrush = activeTool === 'blurBrush';
  const isSharpenTool = activeTool === 'sharpenTool';
  const isHistoryBrushTool = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';

  const renderToolOptions = () => {
    if (isBrushTool) {
      return (
        <BrushOptions
          activeTool={activeTool as 'brush' | 'eraser'}
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          foregroundColor={props.foregroundColor}
          setForegroundColor={props.setForegroundColor}
          brushHardness={brushState.hardness}
          setBrushHardness={(hardness) => setBrushState({ hardness })}
          brushSmoothness={brushState.smoothness || 0}
          setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
          brushShape={brushState.shape as 'circle' | 'square'}
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
          setBrushBlendMode={(blendMode) => setBrushState({ blendMode: blendMode as BlendMode })} // Fixed casting
        />
      );
    }
    
    if (isPencilTool) {
      return (
        <PencilOptions
          brushState={brushState}
          setBrushState={setBrushState}
          onBrushCommit={onBrushCommit}
        />
      );
    }

    if (isGradientTool) {
      return (
        <GradientToolOptions
          gradientToolState={props.gradientToolState}
          setGradientToolState={props.setGradientToolState}
          gradientPresets={props.gradientPresets}
          onApplyGradientPreset={(preset) => props.setGradientToolState(preset.state)}
          onSaveGradientPreset={props.onSaveGradientPreset}
          onDeleteGradientPreset={props.onDeleteGradientPreset}
        />
      );
    }

    if (isSelectionTool) {
      return (
        <SelectionToolOptions
          activeTool={activeTool}
          settings={selectionSettings}
          handleCheckboxChange={handleCheckboxChange}
          handleValueChange={handleValueChange}
          handleValueCommit={handleValueCommit}
        />
      );
    }
    
    if (isPaintBucketTool) {
      return <PaintBucketOptions />;
    }
    
    if (isStampTool) {
      return <StampOptions cloneSourcePoint={props.cloneSourcePoint} />;
    }
    
    if (isHistoryBrushTool) {
      return (
        <HistoryBrushOptions
          activeTool={activeTool as 'historyBrush' | 'artHistoryBrush'}
          history={props.history}
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          brushFlow={brushState.flow}
          setBrushFlow={(flow) => setBrushState({ flow })}
          historyBrushSourceIndex={props.historyBrushSourceIndex}
          setHistoryBrushSourceIndex={props.setHistoryBrushSourceIndex}
        />
      );
    }
    
    if (isBlurBrush) {
      return (
        <BlurBrushOptions
          selectiveBlurStrength={props.selectiveBlurAmount}
          onStrengthChange={props.onSelectiveBlurAmountChange}
          onStrengthCommit={props.onSelectiveBlurAmountCommit}
        />
      );
    }
    
    if (isSharpenTool) {
      return (
        <SharpenToolOptions
          selectiveSharpenStrength={props.selectiveSharpenAmount}
          onStrengthChange={props.onSelectiveSharpenAmountChange}
          onStrengthCommit={props.onSelectiveSharpenAmountCommit}
        />
      );
    }

    // Default case for tools without specific options (Move, Crop, Text, Shape, Eyedropper)
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {activeTool ? `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Tool is active.` : "Select a tool from the left sidebar."}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderToolOptions()}
    </div>
  );
};