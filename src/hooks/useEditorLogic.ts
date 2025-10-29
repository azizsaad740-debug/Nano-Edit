import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './useHistory';
import { useLayers } from './useLayers';
import { useCrop } from './useCrop';
import { useFrame } from './useFrame';
import { useAdjustments } from './useAdjustments';
import { useEffects } from './useEffects';
import { useColorGrading } from './useColorGrading';
import { useHslAdjustments } from './useHslAdjustments';
import { useCurves } from './useCurves';
import { useTransform } from './useTransform';
import { useChannels } from './useChannels';
import { useSelection } from './useSelection';
import { useSelectiveBlur } from './useSelectiveBlur';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useWorkspaceInteraction } from './useWorkspaceInteraction';
import { useImageLoader } from './useImageLoader';
import { useProjectSettings } from './useProjectSettings';
import { usePresets } from './usePresets';
import { useBrush } from './useBrush';
import { useTextTool } from './useTextTool';
import { useShapeTool } from './useShapeTool';
import { useGradientTool } from './useGradientTool';
import { useEyedropper } from './useEyedropper';
import { useGenerativeAi } from './useGenerativeAi';
import { useMoveTool } from './useMoveTool';
import { useLassoTool } from './useLassoTool';
import { useSmartObjectLayers } from './useSmartObjectLayers';
import { useEditorState } from './useEditorState';
import { downloadImage } from '@/utils/imageUtils';
import { upscaleImageApi } from '@/utils/stabilityApi';
import { showError, showSuccess } from '@/utils/toast';
import type { ExportOptionsType } from '@/components/editor/ExportOptions'; // FIX 2: Import as type
import { initialEditState } from '@/types/editor'; // Import initialEditState

// ... (rest of imports)

// ... (inside useEditorLogic)

// ... (around line 140)
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    state.setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits,
    recordHistory, setCurrentEditState, initialEditState, initialLayerState, initialHistoryItem, // FIX 1: Removed redundant currentEditState
    setSelectedLayerId, clearSelectionState,
  );

// ... (around line 150)
  const handleExport = async (options: ExportOptionsType) => { // FIX 2: ExportOptionsType is now correctly imported as a type
    if (!dimensions || !image) {
// ...

// ... (around line 177)
      } catch (error) {
        showError("Failed to upscale image.");
      } finally {
        if (toastId) toast.dismiss(toastId); // FIX 3: Use toast.dismiss and check if toastId exists
      }
    }
  };
// ...