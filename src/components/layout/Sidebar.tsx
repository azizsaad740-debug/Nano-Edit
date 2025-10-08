import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Sidebar = () => {
  return (
    <aside className="w-80 border-r bg-muted/40 p-4 hidden md:flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Editing Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tools for cropping, lighting, color grading, and more will appear here.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
};

export default Sidebar;