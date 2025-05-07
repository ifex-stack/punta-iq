import React, { ReactNode, useEffect, useState } from 'react';
import MobileNavbar from './mobile-navbar';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useLocation } from 'wouter';

interface MobileAppLayoutProps {
  children: ReactNode;
}

export default function MobileAppLayout({ children }: MobileAppLayoutProps) {
  const [location] = useLocation();
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 60000);
    
    // Listen for network status changes
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Enhanced 3D animation for page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      rotateX: 5,
      z: -100,
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      z: 0,
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      rotateX: -5,
      z: -100,
    }
  };
  
  const pageTransition = {
    type: 'spring',
    stiffness: 350,
    damping: 30,
    mass: 0.8,
    duration: 0.4,
  };
  
  return (
    // Ensure entire app has mobile appearance
    <div className="min-h-screen overflow-x-hidden bg-background max-w-md mx-auto">
      {/* Mobile app status bar with realistic details */}
      <div className="h-7 bg-primary/10 backdrop-blur-md border-b border-primary/10 w-full fixed top-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-full">
          {/* Current time */}
          <div className="text-[10px] font-semibold text-foreground/90">{time}</div>
          
          {/* App name in center */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-[10px] font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              PuntaIQ
            </div>
          </div>
          
          {/* Status icons */}
          <div className="flex items-center gap-1.5">
            {/* Network status */}
            <div className="text-[8px] font-medium text-foreground/70">
              {networkStatus === 'online' ? '5G' : 'offline'}
            </div>
            
            {/* Wifi/signal icon */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/70">
              <path d="M1.5 8.5a11 11 0 0 1 21 0" />
              <path d="M4 12a7 7 0 0 1 16 0" />
              <path d="M7 15.5a3.5 3.5 0 0 1 10 0" />
              <circle cx="12" cy="19" r="1" />
            </svg>
            
            {/* Battery icon */}
            <div className="w-4 h-2 rounded-sm border border-foreground/70 relative flex items-center">
              <div className="absolute left-0.5 top-0.5 bottom-0.5 right-1 bg-foreground/70 rounded-sm" style={{width: '60%'}}></div>
              <div className="w-0.5 h-1 bg-foreground/70 absolute -right-0.5"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content with padding for status bar and bottom nav */}
      <main className="container px-4 pt-10 pb-24 perspective-1000">
        {/* Pull-to-refresh indicator (simulated) */}
        <div className="w-full flex justify-center mb-2">
          <div className="h-1 w-10 rounded-full bg-primary/20"></div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full transform-style-3d"
            style={{ 
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
              backfaceVisibility: "hidden"
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        
        {/* Screen edge highlights for 3D effect */}
        <div className="pointer-events-none fixed inset-0 max-w-md mx-auto">
          <div className="absolute inset-0 rounded-md bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50"></div>
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-30"></div>
        </div>
      </main>
      
      {/* Mobile navigation bar */}
      <MobileNavbar />
    </div>
  );
}