import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { MobileLayout } from './mobile-layout';
import { cn } from '@/lib/utils';

interface MobileAppLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function MobileAppLayout({ children, activeTab: explicitActiveTab }: MobileAppLayoutProps) {
  const [location] = useLocation();
  
  // Determine active page for bottom navigation
  const getActiveTab = () => {
    // If an explicit activeTab is provided, use it
    if (explicitActiveTab) {
      return explicitActiveTab;
    }
    
    // Otherwise infer from the current location
    if (location === '/' || location === '/predictions' || location === '/stats') {
      return 'home';
    }
    if (location.startsWith('/explore') || location.includes('/predictions/') || 
        location.includes('/accumulators') || location.includes('/advanced-analysis')) {
      return 'explore';
    }
    if (location.includes('/history') || location.includes('/historical-dashboard')) {
      return 'history';
    }
    if (location.includes('/favorites') || location.includes('/my-picks') || 
        location.includes('/saved-predictions')) {
      return 'favorites';
    }
    if (location.includes('/pricing') || location.includes('/subscription')) {
      return 'pricing';
    }
    if (location.includes('/profile')) {
      return 'profile';
    }
    
    return 'home';
  };
  
  // Check if we're on a legal page
  const isLegalPage = location.startsWith('/legal/');
  
  // Track current and previous locations for page transitions
  const [prevLocation, setPrevLocation] = useState(location);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  
  // Track page history to determine transition direction
  useEffect(() => {
    // Skip on initial load
    if (prevLocation === location) return;
    
    // Determine transition direction based on path segments
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

  return (
    <MobileLayout
      activeTab={getActiveTab()}
      hideNavbar={isLegalPage}
      fullHeight={true}
      className="bg-background"
    >
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
          className="min-h-full w-full px-4"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MobileLayout>
  );
}

export default MobileAppLayout;