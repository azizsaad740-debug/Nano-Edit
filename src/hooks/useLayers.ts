// ... (lines 500-510 unchanged)
    const gradientType: 'linear' | 'radial' = 
      (gradientToolState.type === 'linear' || gradientToolState.type === 'radial') 
        ? gradientToolState.type 
        : 'linear'; // Default to 'linear' if type is unsupported

    const newLayer: GradientLayerData = {
      id: uuidv4(),
      type: "gradient",
      name: `Gradient ${layers.filter((l) => l.type === "gradient").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1, scaleY: 1,
      gradientType: gradientType, // Use the restricted type
      gradientColors: gradientToolState.colors,
      gradientStops: gradientToolState.stops, // ADDED
      angle: gradientToolState.angle, // ADDED
      isReversed: gradientToolState.isReversed, // ADDED
      isDithered: gradientToolState.isDithered, // ADDED
    }; // <-- Object closed correctly

    // ... (rest of function)