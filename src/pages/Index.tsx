import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "@/integrations/supabase/session-provider";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// New Modular Components
import { EditorHeader } from "@/components/layout/EditorHeader";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";

// Dialogs
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { CustomFontLoader } from "@/components/editor/CustomFontLoader";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";

// Hooks
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { showError } from "@/utils/toast";


// --- Main Component Definition ---

export const Index = () => {
  const { user, isGuest } = useSession();
  const navigate = useNavigate();

  // --- Refs ---
  const imgRef = useRef<HTMLImageElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // --- Dialog State ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isGenerativeFillOpen, setIsGenerativeFillOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);

  // --- Editor Logic Hook ---
  const logic = useEditorLogic(imgRef, workspaceRef);
  const {
    image, handleNewProject, handleExport,
    geminiApiKey, stabilityApiKey,
    dimensions, currentEditState, layers,
    smartObjectEditingId, selectedLayer,
    selectionPath, selectionMaskDataUrl,
    handleGenerateImage, handleGenerativeFill,
    handleProjectSettingsUpdate, // Destructure the new property
  } = logic;

  // --- Smart Object Editor State ---
  const isSmartObjectEditorOpen = !!smartObjectEditingId;
  const smartObjectLayer = layers.find(l => l.id === smartObjectEditingId);

  // --- AI Action Wrappers (to set dialog state) ---
  const handleGenerateImageWrapper = useCallback((resultUrl: string) => {
    logic.handleGenerateImage(resultUrl);
    setIsGenerateOpen(false);
  }, [logic.handleGenerateImage]);

  const handleGenerativeFillWrapper = useCallback((resultUrl: string, maskDataUrl: string | null) => {
    logic.handleGenerativeFill(resultUrl, maskDataUrl);
    setIsGenerativeFillOpen(false);
  }, [logic.handleGenerativeFill]);


  if (isSmartObjectEditorOpen && smartObjectLayer && smartObjectLayer.type === 'smart-object') {
    return (
      <SmartObjectEditor
        layer={smartObjectLayer}
        onClose={logic.closeSmartObjectEditor}
        onSave={logic.saveSmartObjectChanges}
        foregroundColor={logic.foregroundColor}
        backgroundColor={logic.backgroundColor}
        selectedShapeType={logic.selectedShapeType}
        brushState={logic.brushState}
        gradientToolState={logic.gradientToolState}
        setBrushState={logic.setBrushState}
        setGradientToolState={logic.setGradientToolState}
        activeTool={logic.activeTool}
        setActiveTool={logic.setActiveTool}
        setSelectedShapeType={logic.setSelectedShapeType}
        zoom={logic.zoom}
        setZoom={logic.setZoom}
        handleZoomIn={logic.handleZoomIn}
        handleZoomOut={logic.handleZoomOut}
        handleFitScreen={logic.handleFitScreen}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <CustomFontLoader customFonts={logic.customFonts} />
      
      <EditorHeader
        logic={logic}
        setIsNewProjectOpen={setIsNewProjectOpen}
        setIsExportOpen={setIsExportOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsImportOpen={setIsImportOpen}
        setIsGenerateOpen={setIsGenerateOpen}
        setIsGenerativeFillOpen={setIsGenerativeFillOpen}
        setIsProjectSettingsOpen={setIsProjectSettingsOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      <main className={cn("flex flex-1 min-h-0", isFullscreen ? 'absolute inset-0 z-50' : 'relative')}>
        {/* Left Sidebar (Tools Panel) */}
        <LeftSidebar logic={logic} />

        {/* Main Workspace Area */}
        <EditorWorkspace logic={logic} workspaceRef={workspaceRef} imgRef={imgRef} />

        {/* Right Sidebar (Layers, Properties, Adjustments) */}
        <aside className="w-80 shrink-0 border-l bg-sidebar">
          <RightSidebar logic={logic} />
        </aside>
      </main>

      {/* Hidden File Input for Loading */}
      <input
        type="file"
        id="file-upload-input"
        className="hidden"
        accept="image/*,.nanoedit"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.name.endsWith('.nanoedit')) {
              logic.handleLoadProject(file);
            } else {
              logic.handleImageLoad(file);
            }
          }
          e.target.value = ''; // Clear input
        }}
      />

      {/* Dialogs */}
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onNewProject={logic.handleNewProject}
      />
      <ExportOptions
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExport={logic.handleExport}
        dimensions={dimensions}
      />
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      <ImportPresetsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
      <GenerateImageDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onGenerate={handleGenerateImageWrapper}
        apiKey={geminiApiKey}
        imageNaturalDimensions={dimensions}
      />
      <GenerativeDialog
        open={isGenerativeFillOpen}
        onOpenChange={setIsGenerativeFillOpen}
        onApply={handleGenerativeFillWrapper}
        apiKey={geminiApiKey}
        originalImage={image}
        selectionPath={selectionPath}
        selectionMaskDataUrl={selectionMaskDataUrl}
        imageNaturalDimensions={dimensions}
      />
      <ProjectSettingsDialog
        open={isProjectSettingsOpen}
        onOpenChange={setIsProjectSettingsOpen}
        currentDimensions={dimensions}
        currentColorMode={currentEditState.colorMode}
        onUpdateSettings={handleProjectSettingsUpdate}
      />
    </div>
  );
};