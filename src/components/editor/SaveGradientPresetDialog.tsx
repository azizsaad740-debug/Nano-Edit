import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveGradientPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export const SaveGradientPresetDialog = ({ open, onOpenChange, onSave }: SaveGradientPresetDialogProps) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
    }
  }, [open]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      onOpenChange(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Gradient Preset</DialogTitle>
          <DialogDescription>Give your current gradient settings a name to save them as a preset.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              onKeyDown={handleKeyDown}
              className="col-span-3" 
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Preset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};