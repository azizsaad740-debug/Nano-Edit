# NanoEdit Core Architecture: Plugin-Based System

The NanoEdit application is built on an immutable core foundation. All major features (AI tools, advanced filters, brushes, templates) are implemented as isolated, sandboxed extensions.

## 1. Core Module Map & Key Interfaces

The Core is responsible for state management (Zustand), rendering the workspace, and providing a secure API bridge to extensions.

### Core Interfaces (TypeScript Contracts)

#### `EditorAPI` (The Bridge to the Core)

This interface defines the methods extensions can safely call to interact with the editor state, layers, and history.

```typescript
interface EditorAPI {
  // State Accessors
  getLayers(): Layer[];
  getEditState(): EditState;
  getDimensions(): Dimensions | null;
  getSelectedLayerId(): string | null;
  
  // Layer Manipulation
  updateLayer(id: string, updates: Partial<Layer>): void;
  addLayer(layer: Layer): void;
  deleteLayer(id: string): void;
  
  // History & Persistence
  recordHistory(name: string, stateUpdates?: Partial<EditState>, layers?: Layer[]): void;
  
  // UI/Feedback
  showToast(type: 'success' | 'error' | 'loading', message: string): string | number;
  dismissToast(id: string | number): void;
  
  // Security & Auth
  getUserRole(): 'guest' | 'registered' | 'admin';
  getApiKey(service: 'gemini' | 'stability'): string | null;
  
  // Worker Communication (for calling other extensions)
  invokeExtension(extensionId: string, method: string, args: any[]): Promise<any>;
}
```

#### `EditorExtension` (The Extension Contract)

This interface defines the lifecycle hooks that every extension module must implement.

```typescript
interface EditorExtension {
  /** Unique identifier for the extension (e.g., 'ai-background-remover') */
  id: string;
  /** Display name for the UI */
  name: string;
  /** Initialization hook, receives the EditorAPI instance. */
  init(editorCore: EditorAPI): void;
  /** Optional hook called when a layer is selected in the core app. */
  onLayerSelect?(layer: Layer): void;
  /** Optional hook called when the extension is disabled. */
  dispose?(): void;
  /** Serializable metadata for the Admin Manager. */
  exportConfig(): ExtensionConfig;
}
```

## 2. Extension Lifecycle Hooks

| Hook | Trigger | Purpose |
| :--- | :--- | :--- |
| `init(EditorAPI)` | Extension enabled by Admin Manager | Establishes communication and registers UI components (if applicable). |
| `onLayerSelect(layer)` | User selects a new layer | Allows extensions to update their options panel based on the active layer type. |
| `dispose()` | Extension disabled or Core shuts down | Cleans up Web Worker resources and event listeners. |

## 3. Security Policy

Extensions run in isolated Web Workers and communicate with the main thread via Comlink (RPC).

| Feature | Allowed in Extension? | Notes |
| :--- | :--- | :--- |
| **DOM Access** | ❌ No | Only allowed to use `OffscreenCanvas` for rendering/processing. |
| **Network Access** | ✅ Yes | Restricted to approved endpoints (e.g., Freepik proxy, AI services). |
| **File System** | ❌ No | All file operations must go through the `EditorAPI` (e.g., Storage, IndexedDB). |
| **WASM** | ✅ Yes | Encouraged for performance-critical tasks (e.g., `wasm-imagemagick`). |
| **Error Boundaries** | Automatic | Core wraps extension calls in `try/catch`. Failures result in a "Tool crashed - reload" toast and extension deactivation. |

## 4. Authentication System (RBAC)

| User Type | Capabilities | Auth Flow |
| :--- | :--- | :--- |
| **Guest** | Basic editing; no AI/cloud storage. | Anonymous JWT session (local storage flag). |
| **Registered** | Full AI tools + cloud projects. | Email confirmation + Google OAuth. |
| **Admin** | Extension manager + audit logs. | Dedicated login + RBAC (`profiles.is_admin = true`). |

### Admin Security

*   **Admin Dashboard:** Accessible only via `/admin` route, protected by `isAdmin` check in `SessionProvider`.
*   **Initial Credentials:** Must be seeded via environment variables (e.g., `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`) for initial setup.