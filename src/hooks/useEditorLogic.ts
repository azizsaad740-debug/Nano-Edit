// ... (lines 1-463 unchanged)

    // Internal State
    marqueeStart, marqueeCurrent, gradientStart, gradientCurrent, 
    // Removed duplicate cloneSourcePoint, setCloneSourcePoint (Fix 5, 6)
    selectiveBlurMask, selectiveSharpenMask,

    // Selection/Channels (Fix 8-16, 22)
    onSelectionSettingChange,
    onSelectionSettingCommit,
    channels,
    onChannelChange,
    
    // Layer Management (Fix 17, 19, 23)
    setSelectedLayerId,

    // Brush/Retouch Handlers (Fix 18, 20)
    handleSelectiveRetouchStrokeEnd,
    
    // Zoom handler for EditorWorkspace (Fix 7)
    handleZoomOut,

    // ... rest of the return object
}), [
// ... (dependencies unchanged)
]);