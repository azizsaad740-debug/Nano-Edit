// ... (around line 47)
        <div className="flex items-center justify-between">
          <Label htmlFor={String(key)} className="text-sm">{label}</Label> // FIX 116
          <div className="flex items-center gap-2">
// ... (around line 58)
        <Slider
          id={String(key)} // FIX 117
          min={min}
// ...