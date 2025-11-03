import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, UploadCloud, BarChart, Zap, Layers, Check, X } from 'lucide-react';
import { extensionManager } from '@/core/ExtensionManager';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showError } from '@/utils/toast';

const AdminDashboard = () => {
  const extensions = extensionManager.getExtensions();
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUploadExtension = () => {
    showError("Extension upload is a stub. In a real app, this would deploy a Web Worker/WASM module.");
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 2000);
  };
  
  const handleToggleExtension = (id: string) => {
    showError(`Toggling extension ${id} is a stub.`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-8">
      <Card className="w-full max-w-4xl mt-12">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Settings className="h-6 w-6" /> Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p className="text-lg text-foreground">
            Welcome, Administrator. Manage extensions, monitor system health, and audit logs here.
          </p>
          
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5" /> Extension Manager
          </h3>
          
          <div className="space-y-4">
            <Button onClick={handleUploadExtension} disabled={isUploading}>
              <UploadCloud className="h-4 w-4 mr-2" /> 
              {isUploading ? 'Uploading...' : 'Upload New Extension (Stub)'}
            </Button>
            
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="space-y-3">
                {extensions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No extensions registered.</p>
                ) : (
                  extensions.map((ext) => (
                    <div key={ext.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-semibold text-foreground">{ext.name}</h4>
                          <p className="text-xs text-muted-foreground">{ext.id}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleExtension(ext.id)}
                      >
                        <Check className="h-4 w-4 mr-2 text-green-500" /> Enabled (Stub)
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <Link to="/" className="text-primary hover:underline flex items-center gap-1">
            &larr; Return to Editor
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;