import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Unlock, Folder, FolderOpen, ChevronDown, ChevronRight, Image, Type, PenTool, Square, Layers, Zap, Palette } from 'lucide-react'; // Import icons and Button
import type { Layer, GroupLayerData, AdjustmentLayerData, SmartObjectLayerData, GradientLayerData } from '@/types/editor';
import { isGroupLayer, isAdjustmentLayer, isSmartObjectLayer, isGradientLayer, isTextLayer, isVectorShapeLayer, isDrawingLayer } from '@/types/editor';

// ... (rest of file)

const LayerIcon: React.FC<{ layer: Layer }> = ({ layer }) => {
  if (isGroupLayer(layer)) {
    const groupLayer = layer as GroupLayerData; // Fix 169, 170
    return groupLayer.isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />; // Fix 63
  }
  // ... (rest of icons)
};

// ... (LayerItem component)

// ... (around line 139)
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => { e.stopPropagation(); toggleGroupExpanded(layer.id); }}
            >
              {(layer as GroupLayerData).isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} {/* Fix 64, 171-174 */}
            </Button> {/* Fix 175 */}
          )}
        </div>
      </div>
      {/* ... */}
    </div>
  );
};