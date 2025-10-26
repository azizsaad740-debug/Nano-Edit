// ... (lines 397-399 unchanged)
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={() => selectedLayerId && onInvertLayerMask(selectedLayerId)}
                disabled={!hasMask}
              >
// ... (lines 409-411 unchanged)
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={onApplySelectionAsMask}
                disabled={!hasActiveSelection || !isMaskable}
              >
                <SquareStack className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Apply Selection as Mask</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={buttonSize}
                variant="outline"
                onClick={() => selectedLayerId && onInvertLayerMask(selectedLayerId)}
                disabled={!hasMask}
              >
                <ArrowDownUp className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Invert Layer Mask</p></TooltipContent>
          </Tooltip>

          <Tooltip>
// ... (rest of file unchanged)