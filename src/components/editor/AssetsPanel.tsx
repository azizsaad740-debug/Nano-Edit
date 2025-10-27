import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image } from 'lucide-react';

const AssetsPanel = () => {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Image className="h-8 w-8 mx-auto mb-2" />
      <p>Asset management coming soon.</p>
    </div>
  );
};

export default AssetsPanel;