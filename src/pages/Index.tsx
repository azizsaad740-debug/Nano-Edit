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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
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

  const handleReset = () => {
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    setSelectedFilter("");
  };

  const handleDownload = () => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      const filterString = `${selectedFilter} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
      ctx.filter = filterString;
      
      ctx.drawImage(img, 0, 0);

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
        />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Workspace 
            image={image}
            onImageUpload={handleImageUpload}
            adjustments={adjustments} 
            selectedFilter={selectedFilter} 
          />
        </div>
      </main>
    </div>
  );
};

export default Index;