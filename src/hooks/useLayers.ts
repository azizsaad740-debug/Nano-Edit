// src/hooks/useLayers.ts (around line 29)

interface UseLayersProps {
    layers: Layer[];
    setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
    recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
    currentEditState: EditState;
    dimensions: Dimensions | null;
    foregroundColor: string;
    backgroundColor: string;
    gradientToolState: GradientToolState;
    selectedShapeType: ShapeType | null;
    selectionPath: Point[] | null;
    selectionMaskDataUrl: string | null;
    setSelectionMaskDataUrl: (dataUrl: string | null) => void;
    clearSelectionState: () => void;
    setImage: (image: string | null) => void;
    setFileInfo: (info: { name: string; size: number } | null) => void;
    setSelectedLayerId: (id: string | null) => void;
    selectedLayerId: string | null;
}
// ... (rest of file)