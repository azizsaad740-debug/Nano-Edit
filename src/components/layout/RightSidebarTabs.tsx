// ... (around line 270)
export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const { selectedLayer } = props;
  const selectedLayerId = selectedLayer?.id;

  // Props for LayersPanel (FIX 9-45: Moved inside component scope)
  const layersPanelProps = {
    layers: props.layers,
    selectedLayerId: props.selectedLayerId,
    onSelectLayer: props.onSelectLayer,
    onReorder: props.onReorder,
    toggleLayerVisibility: props.toggleLayerVisibility,
    renameLayer: props.renameLayer,
    deleteLayer: props.deleteLayer,
    onDuplicateLayer: props.onDuplicateLayer,
    onMergeLayerDown: props.onMergeLayerDown,
    onRasterizeLayer: props.onRasterizeLayer,
    onCreateSmartObject: props.onCreateSmartObject,
    onOpenSmartObject: props.onOpenSmartObject,
    onLayerPropertyCommit: props.onLayerPropertyCommit, // Full commit signature (needed by LayersPanel)
    onLayerOpacityChange: props.onLayerOpacityChange,
    onLayerOpacityCommit: props.onLayerOpacityCommit,
    // FIX 2: Mapping layer creation functions to expected 'onAdd' prefix
    onAddTextLayer: props.addTextLayer,
    onAddDrawingLayer: props.addDrawingLayer,
    onAddShapeLayer: props.addShapeLayer,
    // Keeping original props for backward compatibility if needed, but adding the required 'onAdd' versions.
    onAddLayerFromBackground: props.onAddLayerFromBackground,
    onLayerFromSelection: props.onLayerFromSelection,
    addShapeLayer: props.addShapeLayer,
    onAddGradientLayer: props.addGradientLayer,
    onAddAdjustmentLayer: props.onAddAdjustmentLayer,
    selectedShapeType: props.selectedShapeType,
    groupLayers: props.groupLayers,
    toggleGroupExpanded: props.toggleGroupExpanded,
    onRemoveLayerMask: props.onRemoveLayerMask,
    onInvertLayerMask: props.onInvertLayerMask,
    onToggleClippingMask: props.onToggleClippingMask,
    onToggleLayerLock: props.onToggleLayerLock,
    onDeleteHiddenLayers: props.onDeleteHiddenLayers,
    onRasterizeSmartObject: props.onRasterizeSmartObject,
    onConvertSmartObjectToLayers: props.onConvertSmartObjectToLayers,
    onExportSmartObjectContents: props.onExportSmartObjectContents,
    onArrangeLayer: props.onArrangeLayer,
    hasActiveSelection: props.hasActiveSelection,
    onApplySelectionAsMask: props.onApplySelectionAsMask,
  };
// ... (rest of the component)