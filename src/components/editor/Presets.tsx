import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Preset } from "@/hooks/usePresets";

interface PresetsProps {
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onDeletePreset: (name: string) => void;
}

const Presets = ({ presets, onApplyPreset, onSavePreset, onDeletePreset }: PresetsProps) => {
  return (
    <div className="space-y-2">
      <Button onClick={onSavePreset} size="sm" className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" />
        Save Current Settings
      </Button>
      <ScrollArea className="h-32">
        <div className="flex flex-col gap-1 pr-4">
          {presets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center pt-4">No saved presets.</p>
          ) : (
            presets.map((preset) => (
              <div key={preset.name} className="flex items-center gap-2 group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => onApplyPreset(preset)}
                >
                  {preset.name}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the "{preset.name}" preset. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeletePreset(preset.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Presets;