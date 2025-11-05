// ... (lines 145-152)
  // --- Internal Layer Creation Logic ---
  
  const createBaseLayer = (type: Layer['type'], name: string, position: { x: number; y: number } = { x: 50, y: 50 }): Omit<Layer, 'type'> => ({
    id: uuidv4(),
    name,
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isLocked: false,
    maskDataUrl: null,
    isClippingMask: false,
    x: position.x, y: position.y, width: 50, height: 10, rotation: 0, scaleX: 1, scaleY: 1,
  });

  const addTextLayer = () => {
    const newLayer: TextLayerData = {
      ...createBaseLayer('text', 'Text Layer', { x: 50, y: 50 }),
      type: 'text',
      content: 'New Text',
      fontSize: 48,
      color: foregroundColor,
      fontFamily: 'Roboto',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      padding: 0,
      width: 50, height: 10,
    };
    setInternalLayers(prev => [newLayer, ...prev]);
    setInternalSelectedLayerId(newLayer.id);
    showSuccess(`Added Text Layer.`);
  }; // <-- MISSING CLOSING BRACE RESTORED

  const addDrawingLayer = () => {
    const newLayer: DrawingLayerData = {
// ... (rest of the file)