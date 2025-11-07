import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    // Client-side check only
    if (typeof window === 'undefined') return;
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Use matchMedia for better performance and consistency
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", onChange);
    
    // Set initial state
    onChange(); 
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Return true only if explicitly determined to be mobile
  return !!isMobile;
}