import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

const HistoryPanel = () => {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <History className="h-8 w-8 mx-auto mb-2" />
      <p>History is managed in the Editor Controls tab.</p>
    </div>
  );
};

export default HistoryPanel;