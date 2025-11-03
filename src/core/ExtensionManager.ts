import type { EditorAPI, EditorExtension } from "./EditorAPI";

/**
 * Manages the registration, initialization, and invocation of editor extensions.
 */
export class ExtensionManager {
  private extensions = new Map<string, EditorExtension>();
  private coreApi: EditorAPI | null = null;

  register(extension: EditorExtension) {
    if (this.extensions.has(extension.id)) {
      console.warn(`Extension ${extension.id} already registered.`);
      return;
    }
    this.extensions.set(extension.id, extension);
    if (this.coreApi) {
      extension.init(this.coreApi, this);
    }
  }

  initialize(coreApi: EditorAPI) {
    this.coreApi = coreApi;
    this.extensions.forEach(ext => ext.init(coreApi, this));
  }

  async invokeExtension(extensionId: string, method: string, args: any[]): Promise<any> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found.`);
    }
    const func = extension[method];
    if (typeof func !== 'function') {
      throw new Error(`Method ${method} not found on extension ${extensionId}.`);
    }
    
    try {
      // Invoke the method, binding 'this' to the extension instance
      return await func.apply(extension, args);
    } catch (error) {
      console.error(`Error invoking extension ${extensionId}.${method}:`, error);
      // In a real system, this would trigger an error boundary/toast
      throw error;
    }
  }
  
  getExtensions(): EditorExtension[] {
    return Array.from(this.extensions.values());
  }
}

// Export a singleton instance
export const extensionManager = new ExtensionManager();