import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CommunityTemplate } from "../../types/template"; // FIXED: Relative path
import { Download } from "lucide-react";

interface TemplateCardProps {
  template: CommunityTemplate;
  onSelect: (template: CommunityTemplate) => void;
}

export const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={template.previewUrl}
            alt={template.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg truncate">{template.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-10">{template.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={() => onSelect(template)} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
};