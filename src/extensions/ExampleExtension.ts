import type { EditorAPI, EditorExtension } from "@/core/EditorAPI";
import type { ExtensionManager } from "@/core/ExtensionManager";
import { Zap } from "lucide-react";

/**
 * Example Extension: A simple tool that inverts the image colors globally.
 */
export class InvertToolExtension implements EditorExtension {
  id = 'invert-tool';
  name = 'Invert Colors';
  private api: EditorAPI | null = null;

  init(editorCore: EditorAPI, manager: ExtensionManager) {
    this.api = editorCore;
    console.log(`${this.name} initialized.`);
  }

  // Method that can be invoked by the core app (e.g., from a menu item)
  async runInvert() {
    if (!this.api) return;
    
    const state = this.api.getEditState();
    const newInvert = state.grading.invert === 100 ? 0 : 100;
    
    // Simulate updating the state via the API
    const newGrading = { ...state.grading, invert: newInvert };
    const newState = { ...state, grading: newGrading };
    
    this.api.recordHistory(
      newInvert === 100 ? 'Apply Invert Filter' : 'Remove Invert Filter',
      newState,
      this.api.getLayers()
    );
    
    this.api.showToast('success', `${this.name} toggled.`);
  }
  
  // Optional: Render a button for the Admin Panel
  renderAdminButton() {
    return (
      <button 
        key={this.id} 
        onClick={() => this.runInvert()} 
        className="p-4 border rounded-lg flex items-center gap-3 bg-accent/50 hover:bg-accent"
      >
        <Zap className="h-6 w-6 text-primary" />
        <div>
          <h4 className="font-semibold text-foreground">{this.name}</h4>
          <p className="text-sm">Toggle global color inversion.</p>
        </div>
      </button>
    );
  }
}