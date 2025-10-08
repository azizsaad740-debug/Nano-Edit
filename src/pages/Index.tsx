import { useState, useRef } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/editor/Workspace";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import EditorControls from "@/components/layout/EditorControls";
import { type Crop } from 'react-image-crop';

interface EditState {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  effects: {
    blur: number;
    hueShift: number;
  };
  selectedFilter: string;
  transforms: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  crop: Crop | undefined;
}

const initialEditState: EditState = {
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
  effects: { blur: 0, hueShift: 0 },
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  crop: undefined,
};

const Index = () => {
  const [image, setImage] = useState<string | null>(null);
  const [history, setHistory] = useState<EditState[]>([initialEditState]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);

  const currentState = history[currentHistoryIndex];
  const { adjustments, effects, selectedFilter, transforms, crop } = currentState;

  const recordHistory = (newState: EditState) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    setHistory([...newHistory, newState]);
    setCurrentHistoryIndex(newHistory.length);
  };

  const updateCurrentState = (updates: Partial<EditState>) => {
    const newState = { ...currentState, ...updates };
    const newHistory = [...history];
    newHistory[currentHistoryIndex] = newState;
    setHistory(newHistory);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setHistory([initialEditState]);
        setCurrentHistoryIndex(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdjustmentChange = (adjustment: string, value: number) => {
    const newAdjustments = { ...currentState.adjustments, [adjustment]: value };
    recordHistory({ ...currentState, adjustments: newAdjustments });
  };

  const handleEffectChange = (effect: string, value: number) => {
    const newEffects = { ...currentState.effects, [effect]: value };
    recordHistory({ ...currentState, effects: newEffects });
  };

  const handleFilterChange = (filterValue: string) => {
    recordHistory({ ...currentState, selectedFilter: filterValue });
  };

  const handleTransformChange = (transformType: string) => {
    const newTransforms = { ...currentState.transforms };
    switch (transformType) {
      case "rotate-left":
        newTransforms.rotation = (newTransforms.rotation - 90 + 360) % 360;
        break;
      case "rotate-right":
        newTransforms.rotation = (newTransforms.rotation + 90) % 360;
        break;
      case "flip-horizontal":
        newTransforms.scaleX *= -1;
        break;
      case "flip-vertical":
        newTransforms.scaleY *= -1;
        break;
      default:
        return;
    }
    recordHistory({ ...currentState, transforms: newTransforms });
  };

  const handleCropChange = (newCrop: Crop) => {
    updateCurrentState({ crop: newCrop });
  };

  const handleCropComplete = (newCrop: Crop) => {
    recordHistory({ ...currentState, crop: newCrop });
  };

  const handleReset = () => {
    recordHistory(initialEditState);
  };

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

  const handleDownload = () => {
    const img = imgRef.current;
    if (!image || !img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const pixelCrop = (crop && crop.width > 0)
      ? {
          x: crop.x * scaleX,
          y: crop.y * scaleY,
          width: crop.width * scaleX,
          height: crop.height * scaleY,
        }
      : {
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };

    const { rotation } = transforms;
    const isSwapped = rotation === 90 || rotation === 270;
    canvas.width = isSwapped ? pixelCrop.height : pixelCrop.width;
    canvas.height = isSwapped ? pixelCrop.width : pixelCrop.height;

    ctx.filter = `${selectedFilter} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${effects.blur}px) hue-rotate(${effects.hueShift}deg)`;
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(transforms.rotation * Math.PI / 180);
    ctx.scale(transforms.scaleX, transforms.scaleY);
    
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      -pixelCrop.width / 2,
      -pixelCrop.height / 2,
      pixelCrop.width,
      pixelCrop.height
    );

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

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
        hasImage={!!image}
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
          />
        </div>
      </main>
    </div>
  );
};

export default Index;