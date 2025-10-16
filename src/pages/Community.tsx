import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCommunityTemplates } from "@/utils/templateApi";
import type { CommunityTemplate } from "../types/template";
import { TemplateCard } from "../components/community/TemplateCard";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, Link, ExternalLink, Google } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/integrations/supabase/session-provider";

const Community = () => {
  const [templates, setTemplates] = React.useState<CommunityTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();
  const { user } = useSession();

  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetchCommunityTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        showError("Failed to load community templates.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const handleSelectTemplate = (template: CommunityTemplate) => {
    try {
      // Store template data in session storage for the editor to pick up
      sessionStorage.setItem('nanoedit-template-data', JSON.stringify(template.data));
      showSuccess(`Template "${template.name}" loaded. Redirecting to editor...`);
      navigate('/', { replace: true });
    } catch (error) {
      showError("Failed to load template data.");
    }
  };

  const handleConnectFreepik = () => {
    if (!user) {
      showError("Please log in with Google first to simulate connecting external accounts.");
      return;
    }
    showSuccess("Successfully connected Google account to Freepik (Stub).");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-8">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" />
            Community Templates
          </CardTitle>
          <p className="text-muted-foreground">Start your design with a pre-built, fully editable template.</p>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Link className="h-5 w-5" />
              Linked Assets (Stub)
            </h3>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  Freepik / Adobe Stock
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </p>
                <p className="text-sm text-muted-foreground">
                  Connect your Google account to access and import complex layered assets (AI, PSD, CDR) directly.
                </p>
              </div>
              <Button 
                onClick={handleConnectFreepik} 
                disabled={!user}
                className="mt-3 md:mt-0 shrink-0"
              >
                <Google className="h-4 w-4 mr-2" />
                {user ? "Connect Account (Stub)" : "Log in to Connect"}
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          <h3 className="text-xl font-semibold mb-4">Featured Templates</h3>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {templates.map((template) => (
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  onSelect={handleSelectTemplate} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Community;