import type { Layer } from "@/types/editor";
import type { EditState } from "@/types/editor";
import type { BrushState } from "@/types/editor";

export type ToastType = 'success' | 'error' | 'loading';

export interface EditorAPI {
    // State Accessors
    getLayers(): Layer[];
    getEditState(): EditState;
    getDimensions(): { width: number; height: number } | null;
    getSelectedLayerId(): string | null;
    getBrushState(): BrushState;
    getSelectionMaskDataUrl(): string | null;
    
    // Layer Manipulation
    updateLayer(id: string, updates: Partial<Layer>): void;
    setLayers(layers: Layer[]): void;
    
    // History & Persistence
    recordHistory(name: string, stateUpdates?: Partial<EditState>, layers?: Layer[]): void;
    
    // UI/Feedback
    showToast: (type: ToastType, message: string) => string | number | void;
    dismissToast(id: string | number): void;
    
    // Security & Auth
    getUserRole(): 'guest' | 'registered' | 'admin';
    getApiKey(service: 'gemini' | 'stability'): string | null;
    
    // Worker Communication (for calling other extensions)
    invokeExtension(extensionId: string, method: string, args: any[]): Promise<any>;
}

export interface EditorExtension {
  /** Unique identifier for the extension (e.g., 'ai-background-remover') */
  id: string;
  /** Display name for the UI */
  name: string;
  /** Initialization hook, receives the EditorAPI instance. */
  init(editorCore: EditorAPI, manager: any): void;
  /** Optional hook called when a layer is selected in the core app. */
  onLayerSelect?(layer: Layer): void;
  /** Optional hook called when the extension is disabled. */
  dispose?(): void;
  /** Serializable metadata for the Admin Manager. */
  exportConfig?(): any;
}