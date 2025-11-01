import { useHotkeys } from 'react-hotkeys-hook';
import type { ActiveTool } from '@/types/editor';

export const useKeyboardShortcuts = ({
  activeTool,
  setActiveTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onDownloadClick,
  onCopy,
  onTransformChange,
  onSwapColors,
  onNewProjectClick,
  onOpenProject,
  onSaveProject,
  onGenerativeFill,
  onDelete,
  onDeselect,
}: {
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onDownloadClick: () => void;
  onCopy: () => void;
  onTransformChange: (type: string) => void;
  onSwapColors: () => void;
  onNewProjectClick: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onGenerativeFill: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}) => {
  // Tool selection shortcuts
  useHotkeys('v', () => setActiveTool('move'), { preventDefault: true }); // Move Tool
  
  // Selection Tools (M, L, W, A)
  useHotkeys('m', () => setActiveTool('marqueeRect'), { preventDefault: true }); // Marquee Tool (Rectangular)
  useHotkeys('shift+m', () => setActiveTool('marqueeEllipse'), { preventDefault: true }); // Marquee Tool (Elliptical)
  useHotkeys('l', () => setActiveTool('lasso'), { preventDefault: true }); // Lasso Tool (Freehand)
  useHotkeys('shift+l', () => setActiveTool('lassoPoly'), { preventDefault: true }); // Polygonal Lasso
  useHotkeys('w', () => setActiveTool('quickSelect'), { preventDefault: true }); // Quick Selection Tool
  useHotkeys('shift+w', () => setActiveTool('magicWand'), { preventDefault: true }); // Magic Wand Tool
  useHotkeys('a', () => setActiveTool('objectSelect'), { preventDefault: true }); // Object Selection Tool
  
  // Paint & Fill Tools (B, E, G)
  useHotkeys('b', () => setActiveTool('brush'), { preventDefault: true });
  useHotkeys('shift+b', () => setActiveTool('pencil'), { preventDefault: true }); // Pencil Tool
  useHotkeys('e', () => setActiveTool('eraser'), { preventDefault: true });
  useHotkeys('g', () => setActiveTool('paintBucket'), { preventDefault: true }); // Paint Bucket
  useHotkeys('shift+g', () => setActiveTool('gradient'), { preventDefault: true }); // Gradient Tool
  
  // Stamp & History Tools (S, Y)
  useHotkeys('s', () => setActiveTool('cloneStamp'), { preventDefault: true }); // Clone Stamp
  useHotkeys('shift+s', () => setActiveTool('patternStamp'), { preventDefault: true }); // Pattern Stamp
  useHotkeys('y', () => setActiveTool('historyBrush'), { preventDefault: true }); // History Brush
  useHotkeys('shift+y', () => setActiveTool('artHistoryBrush'), { preventDefault: true }); // Art History Brush

  // Retouch & Masking Tools (U, Q)
  useHotkeys('u', () => setActiveTool('blurBrush'), { preventDefault: true }); // Blur Brush
  useHotkeys('shift+u', () => setActiveTool('sharpenTool'), { preventDefault: true }); // Sharpen Tool (Stub)
  useHotkeys('q', () => setActiveTool('selectionBrush'), { preventDefault: true }); // Selection Brush (Quick Mask)

  // Other Tools
  useHotkeys('t', () => setActiveTool('text'), { preventDefault: true });
  useHotkeys('p', () => setActiveTool('shape'), { preventDefault: true });
  useHotkeys('c', () => setActiveTool('crop'), { preventDefault: true });
  useHotkeys('i', () => setActiveTool('eyedropper'), { preventDefault: true });

  // Global actions
  useHotkeys('ctrl+z, cmd+z', onUndo, { preventDefault: true });
  useHotkeys('ctrl+y, cmd+y, shift+ctrl+z, shift+cmd+z', onRedo, { preventDefault: true });
  useHotkeys('ctrl+=, cmd+=', onZoomIn, { preventDefault: true });
  useHotkeys('ctrl+-, cmd+-', onZoomOut, { preventDefault: true });
  useHotkeys('f', onFitScreen, { preventDefault: true });
  useHotkeys('ctrl+s, cmd+s', onDownloadClick, { preventDefault: true });
  useHotkeys('ctrl+c, cmd+c', onCopy, { preventDefault: true });
  useHotkeys('x', onSwapColors, { preventDefault: true });
  useHotkeys('ctrl+n, cmd+n', onNewProjectClick, { preventDefault: true });
  useHotkeys('ctrl+o, cmd+o', onOpenProject, { preventDefault: true });
  useHotkeys('ctrl+shift+s, cmd+shift+s', onSaveProject, { preventDefault: true });
  useHotkeys('ctrl+shift+g, cmd+shift+g', onGenerativeFill, { preventDefault: true });
  useHotkeys('delete, backspace', onDelete, { preventDefault: true });
  useHotkeys('ctrl+d, cmd+d', onDeselect, { preventDefault: true });

  // Transform shortcuts
  useHotkeys('r', () => onTransformChange('rotate-right'), { preventDefault: true });
  useHotkeys('shift+r', () => onTransformChange('rotate-left'), { preventDefault: true });
  useHotkeys('h', () => onTransformChange('flip-horizontal'), { preventDefault: true });
  useHotkeys('v', () => onTransformChange('flip-vertical'), { preventDefault: true });
};