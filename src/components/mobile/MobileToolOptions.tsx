// src/components/mobile/MobileToolOptions.tsx (around line 181)

// ... (inside MobileToolOptions component)

// Assuming onReorder prop is passed down from Index.tsx's reorderPanelTabs (2-argument wrapper)
<LayersPanel
    // ... other props
    onReorder={onReorder as (activeId: string, overId: string) => void} // Cast to satisfy the expected 2-argument signature
    // ... other props
/>