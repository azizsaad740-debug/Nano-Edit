import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCommunityTemplates } from "@/utils/templateApi";
import type { CommunityTemplate } from "../types/template";
import { TemplateCard } from "@/components/community/TemplateCard";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom"; // <-- ADDED

export const Community: React.FC = () => {
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- ADDED

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
    showSuccess(`Template "${template.name}" selected. Loading...`);
    // Navigate back to the editor root path, passing the template data in state
    navigate('/', { state: { templateData: template.data, templateName: template.name } });
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