import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/editor/Workspace";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import EditorControls from "@/components/layout/EditorControls";
import { useEditorState } from "@/hooks/useEditorState";

const Index = () => {
  const {
    image,
    imgRef,
    currentState,
    aspect,
    canUndo,
    canRedo,
    handleImageUpload,
    handleAdjustmentChange,
    handleEffectChange,
    handleFilterChange,
    handleTransformChange,
    handleCropChange,
    handleCropComplete,
    handleReset,
    handleUndo,
    handleRedo,
    handleDownload,
    handleCopy,
    setAspect,
    isPreviewingOriginal,
    setIsPreviewingOriginal,
  } = useEditorState();

  const { adjustments, effects, selectedFilter, transforms, crop } = currentState;

  const editorProps = {
    adjustments,
    onAdjustmentChange: handleAdjustmentChange,
    effects,
    onEffectChange: handleEffectChange,
    selectedFilter,
    onFilterChange: handleFilterChange,
    onTransformChange: handleTransformChange,
    onUndo: handleUndo,
    onRedo: handleRedo,
    canUndo,
    canRedo,
    onAspectChange: setAspect,
    aspect,
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <Header 
        onReset={handleReset}
        onDownload={handleDownload}
        onCopy={handleCopy}
        hasImage={!!image}
        onTogglePreview={setIsPreviewingOriginal}
      >
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" disabled={!image}>
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Open edit controls</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[320px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit Image</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <EditorControls {...editorProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Header>
      <main className="flex flex-1 overflow-hidden">
        <Sidebar {...editorProps} />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Workspace 
            image={image}
            onImageUpload={handleImageUpload}
            adjustments={adjustments} 
            effects={effects}
            selectedFilter={selectedFilter} 
            transforms={transforms}
            crop={crop}
            onCropChange={handleCropChange}
            onCropComplete={handleCropComplete}
            aspect={aspect}
            imgRef={imgRef}
            isPreviewingOriginal={isPreviewingOriginal}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;