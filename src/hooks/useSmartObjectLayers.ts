// src/hooks/useSmartObjectLayers.ts (around line 173)
    const newLayer: TextLayerData = {
      id: uuidv4(),
      // ... existing properties
      isLocked: false,
      maskDataUrl: null, // Fix 59
    };

// ... (around line 218)
    const newLayer: DrawingLayerData = {
      id: uuidv4(),
      // ... existing properties
      isLocked: false,
      maskDataUrl: null, // Fix 60
    };

// ... (around line 248)
    const newLayer: VectorShapeLayerData = {
      id: uuidv4(),
      // ... existing properties
      isLocked: false,
      maskDataUrl: null, // Fix 61
    };

// ... (around line 278)
    const newLayer: GradientLayerData = {
      id: uuidv4(),
      // ... existing properties
      isLocked: false,
      maskDataUrl: null, // Fix 62
    };
// ...