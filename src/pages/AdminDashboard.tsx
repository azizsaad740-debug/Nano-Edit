import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, UploadCloud, BarChart } from 'lucide-react';

const AdminDashboard = () => {
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg flex items-center gap-3 bg-accent/50">
              <UploadCloud className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-semibold text-foreground">Extension Manager</h4>
                <p className="text-sm">Upload, enable, and disable features.</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg flex items-center gap-3 bg-accent/50">
              <BarChart className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-semibold text-foreground">System Monitoring</h4>
                <p className="text-sm">View error logs and usage stats.</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg flex items-center gap-3 bg-accent/50">
              <Settings className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-semibold text-foreground">User Management</h4>
                <p className="text-sm">Manage roles and permissions (Stub).</p>
              </div>
            </div>
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