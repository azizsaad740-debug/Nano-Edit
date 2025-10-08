import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/editor/Workspace";

const Index = () => {
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });

  const handleAdjustmentChange = (adjustment: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [adjustment]: value,
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          adjustments={adjustments}
          onAdjustmentChange={handleAdjustmentChange}
        />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Workspace adjustments={adjustments} />
        </div>
      </main>
    </div>
  );
};

export default Index;