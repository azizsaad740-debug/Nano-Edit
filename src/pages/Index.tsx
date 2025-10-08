import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/editor/Workspace";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import EditorControls from "@/components/layout/EditorControls";
import { useEditorState } from "@/hooks/useEditorState";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const Index = () => {
  const {
    image,
    imgRef,
    currentState,
    aspect,
    canUndo,
    canRedo,
    handleFileSelect,
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

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            event.preventDefault();
            return;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleFileSelect]);

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
      <main className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="hidden md:block">
            <Sidebar {...editorProps} />
          </ResizablePanel>
          <ResizableHandle withHandle className="hidden md:flex" />
          <ResizablePanel defaultSize={75}>
            <div className="h-full p-4 md:p-6 lg:p-8 overflow-auto">
              <Workspace 
                image={image}
                onFileSelect={handleFileSelect}
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default Index;