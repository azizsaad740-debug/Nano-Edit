// src/components/editor/Curves.tsx (around line 198)
const colorMap: Record<keyof CurvesState, string> = {
    all: 'hsl(var(--primary))',
    red: 'hsl(0, 100%, 50%)', // Fix 46
    green: 'hsl(120, 100%, 50%)',
    blue: 'hsl(240, 100%, 50%)',
};
// ...