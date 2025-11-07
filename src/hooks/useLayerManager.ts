import { create } from 'zustand';
import { Layer, LayerType } from '@/types/layer';
import { v4 as uuidv4 } from 'uuid';

interface LayerManagerState {
  layers: Layer[];
  selectedLayerId: string | null;
  isLayerPanelOpen: boolean;
  addLayer: (type: LayerType, name: string, initialData?: any) => void;
  selectLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  toggleLayerPanel: () => void;
}

export const useLayerManager = create<LayerManagerState>((set) => ({
  layers: [
    {
      id: uuidv4(),
      name: 'Background',
      type: LayerType.Image,
      isVisible: true,
      data: {
        src: '/placeholder.jpg', // Default placeholder image
        width: 800,
        height: 600,
      },
    },
  ],
  selectedLayerId: null,
  isLayerPanelOpen: true,
  
  toggleLayerPanel: () => set((state) => ({ isLayerPanelOpen: !state.isLayerPanelOpen })),

  addLayer: (type, name, initialData = {}) =>
    set((state) => {
      const newLayer: Layer = {
        id: uuidv4(),
        name,
        type,
        isVisible: true,
        data: initialData,
      };
      return { layers: [...state.layers, newLayer], selectedLayerId: newLayer.id };
    }),

  selectLayer: (id) => set({ selectedLayerId: id }),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      ),
    })),

  deleteLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    })),
}));