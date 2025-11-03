import type { Layer, EditState, Dimensions, HistoryItem, BrushState, GradientToolState, SelectionSettings, Point } from "@/types/editor";
import type { ExtensionManager } from "./ExtensionManager";

/**
 * The core API exposed to all extensions.
 * This provides controlled access to the editor state, history, and UI feedback.
 */
export interface EditorAPI {
  // --- State Accessors ---
  getLayers(): Layer[];
  getEditState(): EditState;
  getDimensions(): Dimensions | null;
  getSelectedLayerId(): string | null;
  getBrushState(): BrushState;
  getSelectionMaskDataUrl(): string | null;
  
  // --- Layer Manipulation ---
  updateLayer(id: string, updates: Partial<Layer>): void;
  setLayers(layers: Layer[]): void;
  
  // --- History & Persistence ---
  recordHistory(name: string, stateUpdates?: Partial<EditState>, layers?: Layer[]): void;
  
  // --- UI/Feedback ---
  showToast(type: 'success' | 'error' | 'loading', message: string): string | number;
  dismissToast(id: string | number): void;
  
  // --- Security & Auth ---
  getUserRole(): 'guest' | 'registered' | 'admin';
  getApiKey(service: 'gemini' | 'stability'): string | null;
  
  // --- Extension Communication ---
  invokeExtension(extensionId: string, method: string, args: any[]): Promise<any>;
}

/**
 * The contract that every extension module must implement.
 */
export interface EditorExtension {
  id: string;
  name: string;
  init(editorCore: EditorAPI, extensionManager: ExtensionManager): void;
  // Optional methods for UI/Tool integration (e.g., renderToolOptions, handleToolClick)
  [key: string]: any; 
}