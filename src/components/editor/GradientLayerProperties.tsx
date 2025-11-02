// src/components/editor/GradientLayerProperties.tsx (around line 51)
const handleStopChange = (index: number, newStop: number) => {
    const newStops = [...(layer.stops || [])]; // Fix 114
    newStops[index] = newStop / 100; // Convert to 0-1 range
    handleUpdate({ stops: newStops }); // Fix 115
  };

// ... (around line 58)
    const newColors = [...(layer.gradientColors || ["#FFFFFF", "#000000"])];
    const newStops = [...(layer.stops || [0, 1])]; // Fix 116

// ... (around line 64)
    handleUpdate({ gradientColors: newColors, stops: newStops }); // Fix 117

// ... (around line 71)
    const newColors = (layer.gradientColors || []).filter((_, i) => i !== index);
    const newStops = (layer.stops || []).filter((_, i) => i !== index); // Fix 118
    handleUpdate({ gradientColors: newColors, stops: newStops }); // Fix 119

// ... (around line 161)
                value={[((layer.stops?.[index] ?? index / ((layer.gradientColors?.length || 1) - 1)) * 100)]} // Fix 120
                onValueChange={([v]) => handleStopChange(index, v)}
// ... (around line 166)
              <span className="w-10 text-right text-sm text-muted-foreground">{Math.round((layer.stops?.[index] ?? index / ((layer.gradientColors?.length || 1) - 1)) * 100)}%</span> // Fix 121
// ...