// ... (around line 11)
const {
    hasImage, activeTool, selectedLayer, selectedLayerId, layers, 
    recordHistory, // FIX 28: Add recordHistory
    onSelectLayer, reorderLayers, handleToggleVisibility, renameLayer, deleteLayer, // Added onSelectLayer
    // ... other props
    zoom, handleZoomIn, handleZoomOut, handleFitScreen, // FIX 27: Add zoom
    // ...
  } = logic;
// ...
// Removed imgRef destructuring (Fix 26)
// ... (around line 173)
      onSelectiveBlurAmountChange={setSelectiveBlurAmount}
      onSelectiveBlurAmountCommit={() => recordHistory("Change Selective Blur Strength", currentEditState, layers)} // FIX 28: Use destructured recordHistory
      // Font Manager
// ...