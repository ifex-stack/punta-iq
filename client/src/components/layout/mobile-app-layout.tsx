import React, { ReactNode } from 'react';
import MobileNavbar from './mobile-navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface MobileAppLayoutProps {
  children: ReactNode;
}

export default function MobileAppLayout({ children }: MobileAppLayoutProps) {
  const [location] = useLocation();
  
  // Enhanced animation for smoother transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
      scale: 0.98,
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    out: {
      opacity: 0,
      y: -10,
      scale: 0.98,
    }
  };
  
  const pageTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    duration: 0.3,
  };
  
  return (
    // Ensure entire app has mobile appearance
    <div className="min-h-screen overflow-x-hidden bg-background max-w-md mx-auto">
      {/* Status bar simulation for more app-like feel */}
      <div className="h-6 bg-primary/5 border-b border-primary/10 w-full fixed top-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between px-4">
          <div className="text-[10px] font-semibold text-primary/80">PuntaIQ</div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/70"></div>
            <div className="w-2 h-2 rounded-full bg-primary/70"></div>
            <div className="w-2 h-2 rounded-full bg-primary/70"></div>
          </div>
        </div>
      </div>
      
      {/* Main content with padding for status bar and bottom nav */}
      <main className="container px-4 pt-8 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Mobile navigation bar */}
      <MobileNavbar />
    </div>
  );
}