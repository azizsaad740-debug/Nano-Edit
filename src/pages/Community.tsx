import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCommunityTemplates } from "@/utils/templateApi";
import type { CommunityTemplate } from "../types/template";
import { TemplateCard } from "@/components/community/TemplateCard";
import { showError, showSuccess } from "@/utils/toast";

export const Community: React.FC = () => {
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const fetchedTemplates = await fetchCommunityTemplates();
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error("Failed to fetch community templates:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);
  
  const handleSelectTemplate = (template: CommunityTemplate) => {
    // Stub: In a real app, this would trigger the WASM/Worker pipeline
    showSuccess(`Template "${template.name}" selected. Loading pipeline... (Stub)`);
    // Redirect back to editor or trigger loading process
  };

  if (loading) {
    return <div className="p-8">Loading templates...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Community Templates (Freepik Integration Stub)</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map(template => (
            <TemplateCard 
              key={template.id} 
              template={template} 
              onSelect={handleSelectTemplate} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};