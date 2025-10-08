import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/editor/Workspace";

const Index = () => {
  const [image, setImage] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [selectedFilter, setSelectedFilter] = useState("");
  const [transforms, setTransforms] = useState({
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        handleReset();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdjustmentChange = (adjustment: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [adjustment]: value,
    }));
  };

  const handleFilterChange = (filterValue: string) => {
    setSelectedFilter(filterValue);
  };

  const handleTransformChange = (transformType: string) => {
    setTransforms(prev => {
      switch (transformType) {
        case "rotate-left":
          return { ...prev, rotation: (prev.rotation - 90 + 360) % 360 };
        case "rotate-right":
          return { ...prev, rotation: (prev.rotation + 90) % 360 };
        case "flip-horizontal":
          return { ...prev, scaleX: prev.scaleX * -1 };
        case "flip-vertical":
          return { ...prev, scaleY: prev.scaleY * -1 };
        default:
          return prev;
      }
    });
  };

  const handleReset = () => {
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    setSelectedFilter("");
    setTransforms({ rotation: 0, scaleX: 1, scaleY: 1 });
  };

  const handleDownload = () => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      const isSwapped = transforms.rotation === 90 || transforms.rotation === 270;
      const w = isSwapped ? img.height : img.width;
      const h = isSwapped ? img.width : img.height;
      canvas.width = w;
      canvas.height = h;
      
      const filterString = `${selectedFilter} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
      ctx.filter = filterString;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(transforms.rotation * Math.PI / 180);
      ctx.scale(transforms.scaleX, transforms.scaleY);
      
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <Header 
        onReset={handleReset}
        onDownload={handleDownload}
        hasImage={!!image}
      />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          adjustments={adjustments}
          onAdjustmentChange={handleAdjustmentChange}
          onFilterChange={handleFilterChange}
          selectedFilter={selectedFilter}
          onTransformChange={handleTransformChange}
        />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Workspace 
            image={image}
            onImageUpload={handleImageUpload}
            adjustments={adjustments} 
            selectedFilter={selectedFilter} 
            transforms={transforms}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;