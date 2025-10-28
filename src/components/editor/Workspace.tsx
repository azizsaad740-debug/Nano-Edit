// Assuming the original code was inside a JSX element, likely a div or canvas wrapper.
// The previous fix attempt was an incomplete snippet. Restoring the context:

// ... (inside the main JSX return of Workspace component, around line 783)
<div
  ref={workspaceRef}
  className={cn(
    "relative w-full h-full overflow-hidden",
    // ... other classes
  )}
  onMouseDown={handleWorkspaceMouseDown}
  onMouseMove={handleWorkspaceMouseMove}
  onMouseUp={handleWorkspaceMouseUp}
  onWheel={handleWheel}
  onMouseEnter={() => setIsMouseOverImage(true)} // FIX 3, 4, 5, 6, 7, 8, 47, 48, 49, 50, 51, 52
  onMouseLeave={() => setIsMouseOverImage(false)}
>
// ...
</div>