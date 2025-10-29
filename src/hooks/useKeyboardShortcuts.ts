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
  useHotkeys('m', () => setActiveTool('move'), { preventDefault: true });
  useHotkeys('l', () => setActiveTool('lasso'), { preventDefault: true });
  useHotkeys('b', () => setActiveTool('brush'), { preventDefault: true });
  useHotkeys('e', () => setActiveTool('eraser'), { preventDefault: true });
  useHotkeys('s', () => setActiveTool('selectionBrush'), { preventDefault: true });
  useHotkeys('u', () => setActiveTool('blurBrush'), { preventDefault: true });
  useHotkeys('t', () => setActiveTool('text'), { preventDefault: true });
  useHotkeys('p', () => setActiveTool('shape'), { preventDefault: true });
  useHotkeys('g', () => setActiveTool('gradient'), { preventDefault: true });
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