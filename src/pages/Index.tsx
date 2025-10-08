import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/editor/Workspace";

const Index = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Workspace />
        </div>
      </main>
    </div>
  );
};

export default Index;