// ... (lines 171-175 unchanged)
          <div className="p-4 h-full overflow-y-auto flex flex-col">
            {props.hasImage && (
              <LayersPanel
                layers={props.layers}
                onToggleVisibility={props.toggleLayerVisibility}
                onRename={props.renameLayer}
                onDelete={props.deleteLayer}
                onAddTextLayer={props.addTextLayer}
                onAddDrawingLayer={props.addDrawingLayer}
                onAddLayerFromBackground={props.onAddLayerFromBackground} // NEW
                onLayerFromSelection={props.handleLayerFromSelection} // ADDED missing prop
                onAddShapeLayer={props.addShapeLayer}
                onAddGradientLayer={props.addGradientLayer}
                onAddAdjustmentLayer={props.onAddAdjustmentLayer}
// ... (lines 180-208 unchanged)
                onToggleClippingMask={props.onToggleClippingMask}
                onToggleLayerLock={props.onToggleLayerLock}
              />
            )}
          </div>
        </ResizablePanel>
// ... (rest of file unchanged)