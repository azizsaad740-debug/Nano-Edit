// ... (around line 149)
  // Fix: Safely check if fontWeight is 'bold' or its numeric equivalent '700'
  const isBoldActive = layer.fontWeight === 'bold' || layer.fontWeight === 700 || layer.fontWeight === '700'; // FIX 13
  const isItalicActive = layer.fontStyle === 'italic';
// ...