import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNavigation from './bottom-navigation';
import TopBar from './top-bar';
import { LegalFooter } from './legal-footer';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  
  // Determine active page for bottom navigation
  const getActivePage = () => {
    if (location === '/') return 'home';
    if (location === '/predictions' || location === '/stats') return 'predictions_stats';
    if (location === '/livescore') return 'livescore';
    if (location === '/profile') return 'profile';
    if (location === '/admin') return 'admin';
    
    // Handle secondary pages under main sections
    if (location.startsWith('/predictions/')) return 'predictions_stats';
    if (location.includes('/accumulators')) return 'predictions_stats';
    if (location.includes('/advanced-analysis')) return 'predictions_stats';
    
    return 'home';
  };
  
  // Don't show bottom nav on legal pages
  const isLegalPage = location.startsWith('/legal/');
  
  // Track current and previous locations for page transitions
  const [prevLocation, setPrevLocation] = useState(location);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  
  // Track page history to determine transition direction
  useEffect(() => {
    // Skip on initial load
    if (prevLocation === location) return;
    
    // Determine transition direction based on path segments
    // This is a simple heuristic - could be improved with more sophisticated navigation history
    const prevDepth = prevLocation.split('/').filter(Boolean).length;
    const currentDepth = location.split('/').filter(Boolean).length;
    
    if (currentDepth > prevDepth) {
      setTransitionDirection('forward');
    } else if (currentDepth < prevDepth) {
      setTransitionDirection('backward');
    } else {
      // Same depth, use last location as reference
      setTransitionDirection('forward');
    }
    
    setPrevLocation(location);
  }, [location, prevLocation]);
  
  // Page transition variants
  const pageVariants = {
    initial: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? '100%' : '-100%',
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? '-15%' : '15%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };
  
  // Safe area classes for mobile devices
  const topSafeArea = "pt-safe";
  const hasBottomNav = !isLegalPage;
  
  return (
    <div className={cn(
      "flex flex-col min-h-screen w-full bg-background overflow-hidden",
      topSafeArea
    )}>
      {/* Fixed header */}
      {!isLegalPage && (
        <div className="fixed top-0 left-0 right-0 z-40">
          <TopBar />
        </div>
      )}
      
      {/* Main content with animated page transitions */}
      <main className={cn(
        "flex-1 w-full mx-auto max-w-screen-lg overflow-x-hidden",
        !isLegalPage && "mt-16 mb-20 px-4" // Add margin for fixed header and bottom nav
      )}>
        <AnimatePresence
          mode="wait"
          initial={false}
          custom={transitionDirection}
        >
          <motion.div
            key={location}
            custom={transitionDirection}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className="min-h-full w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Legal footer */}
      <LegalFooter />
      
      {/* Bottom navigation */}
      {hasBottomNav && (
        <BottomNavigation activePage={getActivePage() as any} />
      )}
    </div>
  );
}