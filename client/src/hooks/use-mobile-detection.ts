import { useState, useEffect } from 'react';

export function useMobileDetection(mobileBreakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (to avoid issues during SSR)
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < mobileBreakpoint);
      };
      
      // Initial check
      checkIsMobile();
      
      // Add resize listener
      window.addEventListener('resize', checkIsMobile);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }
  }, [mobileBreakpoint]);

  return isMobile;
}