import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCommunityTemplates } from "@/utils/templateApi";
import type { CommunityTemplate } from "../types/template";

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

  if (loading) {
    return <div className="p-8">Loading templates...</div>;
  }

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map(template => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{template.description}</p>
            {/* Placeholder for template preview */}
            <div className="mt-4 h-40 bg-muted flex items-center justify-center">
              Template Preview
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};