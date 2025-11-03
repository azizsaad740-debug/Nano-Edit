"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { LayersPanel } from '@/components/editor/LayersPanel'; // FIXED IMPORT
import { LayerPropertiesContent } from '@/components/editor/LayerPropertiesContent';
import { ToolOptionsContent } from '@/components/editor/ToolOptionsContent';
import GlobalEffectsPanel from '@/components/editor/GlobalEffectsPanel';
import HistoryPanel from '@/components/auxiliary/HistoryPanel';
import BrushesPanel from '@/components/auxiliary/BrushesPanel';
import PathsPanel from '@/components/auxiliary/PathsPanel';
import AdjustmentsPanel from '@/components/auxiliary/AdjustmentsPanel';
import { ChannelsPanel } from '@/components/editor/ChannelsPanel';
import ColorPanel from '@/components/auxiliary/ColorPanel';
import InfoPanel from '@/components/auxiliary/InfoPanel';
import NavigatorPanel from '@/components/auxiliary/NavigatorPanel';
import ColorCorrectionPanel from '@/components/auxiliary/ColorCorrectionPanel';
import XtraAiPanel from '@/components/auxiliary/XtraAiPanel';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { MobileTab } from './MobileBottomNav';
import type { useEditorLogic } from '@/hooks/useEditorLogic';

interface MobileToolOptionsProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  logic: ReturnType<typeof useEditorLogic>;
  onOpenFontManager: () => void;
  onSavePreset: () => void;
  onSaveGradientPreset: () => void;
  onOpenSettings: () => void;
  onOpenSmartObject: (id: string) => void;
  isGuest: boolean; // NEW
}

export const MobileToolOptions: React.FC<MobileToolOptionsProps> = ({ activeTab, logic, onOpenFontManager, onSavePreset, onSaveGradientPreset, onOpenSettings, onOpenSmartObject, isGuest }) => {
  const navigate = useNavigate();
  
  const renderContent = () => {
    switch (activeTab) {
      case 'layers':
        return (
          <LayersPanel
            layers={logic.layers}
            selectedLayerId={logic.selectedLayerId}
            selectedLayer={logic.selectedLayer}
            onSelectLayer={logic.onSelectLayer}
            onReorder={logic.onLayerReorder} // UPDATED TO onLayerReorder
            toggleLayerVisibility={logic.toggleLayerVisibility}
            renameLayer={logic.renameLayer}
            deleteLayer={logic.deleteLayer}
            onDuplicateLayer={logic.onDuplicateLayer}
            onMergeLayerDown={logic.onMergeLayerDown}
            onRasterizeLayer={logic.onRasterizeLayer}
            onCreateSmartObject={logic.onCreateSmartObject}
            onOpenSmartObject={onOpenSmartObject}
            onLayerUpdate={logic.updateLayer}
            onLayerCommit={logic.commitLayerChange}
            onLayerPropertyCommit={logic.onLayerPropertyCommit}
            onLayerOpacityChange={logic.handleLayerOpacityChange}
            onLayerOpacityCommit={logic.handleLayerOpacityCommit} // FIX: Use exposed name
            addTextLayer={logic.addTextLayer}
            addDrawingLayer={logic.addDrawingLayer}
            onAddLayerFromBackground={logic.onAddLayerFromBackground}
            onLayerFromSelection={logic.onLayerFromSelection}
            addShapeLayer={logic.addShapeLayer}
            addGradientLayer={logic.addGradientLayerNoArgs} // FIX 37: Use the no-arg version
            onAddAdjustmentLayer={logic.onAddAdjustmentLayer}
            selectedShapeType={logic.selectedShapeType}
            groupLayers={logic.groupLayers}
            toggleGroupExpanded={logic.toggleGroupExpanded}
            onRemoveLayerMask={logic.onRemoveLayerMask}
            onInvertLayerMask={logic.onInvertLayerMask}
            onToggleClippingMask={logic.onToggleClippingMask}
            onToggleLayerLock={logic.onToggleLayerLock}
            onDeleteHiddenLayers={logic.onDeleteHiddenLayers}
            onRasterizeSmartObject={logic.onRasterizeSmartObject}
            onConvertSmartObjectToLayers={logic.onConvertSmartObjectToLayers}
            onExportSmartObjectContents={logic.onExportSmartObjectContents}
            onArrangeLayer={logic.onArrangeLayer}
            hasActiveSelection={logic.hasActiveSelection}
            onApplySelectionAsMask={logic.onApplySelectionAsMask}
            handleDestructiveOperation={logic.handleDestructiveOperation}
            foregroundColor={logic.foregroundColor}
          />
        );
      case 'properties':
        return (
          <div className="space-y-4">
            <ToolOptionsContent
              activeTool={logic.activeTool}
              brushState={logic.brushState}
              setBrushState={logic.setBrushState}
              onBrushCommit={logic.onBrushCommit}
              gradientToolState={logic.gradientToolState}
              setGradientToolState={logic.setGradientToolState}
              gradientPresets={logic.gradientPresets}
              onApplyGradientPreset={(preset) => logic.setGradientToolState(preset.state)}
              onSaveGradientPreset={logic.onSaveGradientPreset}
              onDeleteGradientPreset={logic.onDeleteGradientPreset}
              selectiveBlurAmount={logic.selectiveBlurAmount}
              onSelectiveBlurAmountChange={logic.setSelectiveBlurAmount}
              onSelectiveBlurAmountCommit={logic.onSelectiveBlurAmountCommit}
              selectiveSharpenAmount={logic.selectiveSharpenAmount}
              onSelectiveSharpenAmountChange={logic.setSelectiveSharpenAmount}
              onSelectiveSharpenAmountCommit={logic.onSelectiveSharpenAmountCommit}
              cloneSourcePoint={logic.cloneSourcePoint}
              selectionSettings={logic.selectionSettings}
              handleCheckboxChange={logic.onSelectionSettingChange}
              handleValueChange={logic.onSelectionSettingChange}
              handleValueCommit={logic.onSelectionSettingCommit}
              history={logic.history}
              historyBrushSourceIndex={logic.historyBrushSourceIndex}
              setHistoryBrushSourceIndex={logic.setHistoryBrushSourceIndex}
              foregroundColor={logic.foregroundColor}
              setForegroundColor={logic.setForegroundColor}
            />
            {logic.selectedLayer && (
              <LayerPropertiesContent
                selectedLayer={logic.selectedLayer}
                imgRef={logic.imgRef}
                onLayerUpdate={logic.updateLayer}
                onLayerCommit={logic.commitLayerChange}
                systemFonts={logic.systemFonts}
                customFonts={logic.customFonts}
                onOpenFontManager={onOpenFontManager}
                gradientToolState={logic.gradientToolState}
                setGradientToolState={logic.setGradientToolState}
                gradientPresets={logic.gradientPresets}
                onSaveGradientPreset={logic.onSaveGradientPreset}
                onDeleteGradientPreset={logic.onDeleteGradientPreset}
                customHslColor={logic.customHslColor}
                setCustomHslColor={logic.setCustomHslColor}
                onRemoveLayerMask={logic.onRemoveLayerMask}
                onInvertLayerMask={logic.onInvertLayerMask}
                currentEditState={logic.currentEditState}
              />
            )}
          </div>
        );
      case 'adjustments':
        return (
          <div className="space-y-4">
            <GlobalEffectsPanel
              hasImage={logic.hasImage}
              effects={logic.effects}
              onEffectChange={logic.onEffectChange}
              onEffectCommit={logic.onEffectCommit}
              onFilterChange={logic.onFilterChange}
              selectedFilter={logic.selectedFilter}
              onTransformChange={logic.onTransformChange as any} // Casting to fix TS2322
              rotation={logic.rotation}
              onRotationChange={logic.onRotationChange}
              onRotationCommit={logic.onRotationCommit}
              onAspectChange={logic.onAspectChange}
              aspect={logic.aspect}
              frame={logic.frame}
              onFramePresetChange={(type, name, options) => logic.onFramePresetChange(type, name, options)}
              onFramePropertyChange={logic.onFramePropertyChange}
              onFramePropertyCommit={logic.onFramePropertyCommit} // Fixed signature
              presets={logic.presets}
              onApplyPreset={logic.handleApplyPreset}
              onSavePreset={onSavePreset}
              onDeletePreset={logic.onDeletePreset}
            />
            <ColorCorrectionPanel
              adjustments={logic.adjustments}
              onAdjustmentChange={logic.onAdjustmentChange}
              onAdjustmentCommit={logic.onAdjustmentCommit}
              grading={logic.grading}
              onGradingChange={logic.onGradingChange}
              onGradingCommit={logic.onGradingCommit}
              hslAdjustments={logic.hslAdjustments}
              onHslAdjustmentChange={logic.onHslAdjustmentChange}
              onHslAdjustmentCommit={logic.onHslAdjustmentCommit}
              curves={logic.curves}
              onCurvesChange={logic.onCurvesChange}
              onCurvesCommit={logic.onCurvesCommit}
              imgRef={logic.imgRef}
              customHslColor={logic.customHslColor}
              setCustomHslColor={logic.setCustomHslColor}
            />
          </div>
        );
      case 'color':
        return (
          <ColorPanel
            foregroundColor={logic.foregroundColor}
            onForegroundColorChange={logic.setForegroundColor}
            backgroundColor={logic.backgroundColor}
            onBackgroundColorChange={logic.setBackgroundColor}
            onSwapColors={logic.handleSwapColors}
          />
        );
      case 'ai':
        return (
          <XtraAiPanel
            hasImage={logic.hasImage}
            base64Image={logic.base64Image}
            dimensions={logic.dimensions}
            geminiApiKey={logic.geminiApiKey}
            onImageResult={logic.handleGenerateImage}
            onMaskResult={logic.handleMaskResult} // Pass the actual handler
            onOpenSettings={onOpenSettings}
            isGuest={isGuest} // PASSED
          />
        );
      case 'history':
        return (
          <HistoryPanel
            history={logic.history}
            currentIndex={logic.currentHistoryIndex}
            onJump={logic.handleHistoryJump}
            onUndo={logic.undo}
            onRedo={logic.redo}
            canUndo={logic.canUndo}
            canRedo={logic.canRedo}
          />
        );
      case 'channels':
        return (
          <ChannelsPanel
            channels={logic.channels}
            onChannelChange={logic.onChannelChange}
          />
        );
      case 'brushes':
        return (
          <BrushesPanel
            brushState={logic.brushState}
            setBrushState={logic.setBrushState}
          />
        );
      case 'paths':
        return <PathsPanel />;
      case 'info':
        return (
          <InfoPanel
            dimensions={logic.dimensions}
            fileInfo={logic.fileInfo}
            imgRef={logic.imgRef}
            exifData={logic.exifData}
            colorMode={logic.currentEditState.colorMode}
          />
        );
      case 'navigator':
        return (
          <NavigatorPanel
            image={logic.hasImage ? logic.imgRef.current?.src || null : null}
            zoom={logic.zoom} // Use 'zoom' alias
            onZoomIn={logic.handleZoomIn}
            onZoomOut={logic.handleZoomOut}
            onFitScreen={logic.handleFitScreen}
            dimensions={logic.dimensions}
          />
        );
      case 'templates':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Browse and load community templates to start your project.
            </p>
            <Button onClick={() => navigate('/community')}>
              Go to Community Templates
            </Button>
          </div>
        );
      case 'tools':
        // Tool options are already covered in 'properties' tab for mobile
        return (
          <div className="p-4 text-sm text-muted-foreground">
            Tool options are available in the Properties tab.
          </div>
        );
      default:
        return <div className="p-4 text-muted-foreground">Select a panel.</div>;
    }
  };

  return (
    <ScrollArea className="w-full h-full">
      <Card className="w-full border-0 rounded-none">
        <CardContent className="p-4">
          {renderContent()}
        </CardContent>
      </Card>
    </ScrollArea>
  );
};