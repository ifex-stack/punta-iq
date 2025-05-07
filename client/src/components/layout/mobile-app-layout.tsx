import React, { ReactNode, useEffect, useState, useRef } from 'react';
import MobileNavbar from './mobile-navbar';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useLocation } from 'wouter';

interface MobileAppLayoutProps {
  children: ReactNode;
}

export default function MobileAppLayout({ children }: MobileAppLayoutProps) {
  const [location] = useLocation();
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshProgress, setRefreshProgress] = useState<number>(0);
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Motion values for tilt/parallax effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse position to subtle tilt values
  const rotateX = useTransform(mouseY, [0, window.innerHeight], [2, -2]);
  const rotateY = useTransform(mouseX, [0, window.innerWidth], [-2, 2]);
  
  // Smooth the rotation for more natural movement
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });
  
  // Handle mouse movement for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    mouseX.set(clientX);
    mouseY.set(clientY);
  };
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
      
      // Randomly decrease battery over time
      setBatteryLevel(prevLevel => {
        const newLevel = Math.max(1, prevLevel - Math.random() * 0.5);
        return parseFloat(newLevel.toFixed(1));
      });
    }, 60000);
    
    // Listen for network status changes
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for browser-provided battery status if available
    if ('getBattery' in navigator) {
      // @ts-ignore - getBattery may not be in the type defs but exists in some browsers
      navigator.getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100);
        });
      }).catch(() => {
        // Fallback if battery API fails
      });
    }
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Simulated pull-to-refresh functionality
  const handleTouchStart = useRef<number>(0);
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const scrollY = mainRef.current?.scrollTop || 0;
    
    // Only handle pull-to-refresh when at the top of the page
    if (scrollY <= 0) {
      const touchY = touch.clientY;
      
      // On first touch, record the position
      if (handleTouchStart.current === 0) {
        handleTouchStart.current = touchY;
      }
      
      // Calculate pull distance and show refresh indicator
      const pullDistance = touchY - handleTouchStart.current;
      if (pullDistance > 0) {
        // Resist pulling - make it harder to pull down
        const newProgress = Math.min(100, (pullDistance / 150) * 100);
        setRefreshProgress(newProgress);
        
        if (newProgress > 70) {
          setIsRefreshing(true);
        }
      }
    }
  };
  
  const handleTouchEnd = () => {
    // Reset touch position
    handleTouchStart.current = 0;
    
    // Simulate refresh completion after a delay
    if (isRefreshing) {
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshProgress(0);
      }, 1500);
    } else {
      setRefreshProgress(0);
    }
  };
  
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
    // Ensure entire app has mobile appearance with simulated device frame
    <div 
      className="min-h-screen overflow-hidden bg-background max-w-md mx-auto relative"
      style={{
        boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.1)',
        borderRadius: '2rem',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Device frame notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-50"></div>

      {/* Mobile app status bar with realistic details */}
      <div className="h-7 bg-primary/10 backdrop-blur-md border-b border-primary/10 w-full fixed top-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-full">
          {/* Current time */}
          <div className="text-[10px] font-semibold text-foreground/90">{time}</div>
          
          {/* App name in center */}
          <motion.div 
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{
              y: [0, -1, 0, 1, 0],
              opacity: [1, 0.95, 1, 0.95, 1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="text-[10px] font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              PuntaIQ
            </div>
          </motion.div>
          
          {/* Status icons */}
          <div className="flex items-center gap-1.5">
            {/* Network status */}
            <div className="text-[8px] font-medium text-foreground/70">
              {networkStatus === 'online' ? '5G' : 'offline'}
            </div>
            
            {/* Wifi/signal icon with animation */}
            <motion.svg 
              width="10" 
              height="10" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="text-foreground/70"
              animate={{
                opacity: networkStatus === 'online' ? [1, 0.8, 1] : [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <path d="M1.5 8.5a11 11 0 0 1 21 0" />
              <path d="M4 12a7 7 0 0 1 16 0" />
              <path d="M7 15.5a3.5 3.5 0 0 1 10 0" />
              <circle cx="12" cy="19" r="1" />
            </motion.svg>
            
            {/* Battery icon with dynamic level */}
            <div className="w-4 h-2 rounded-sm border border-foreground/70 relative flex items-center">
              <motion.div 
                className={`absolute left-0.5 top-0.5 bottom-0.5 rounded-sm ${
                  batteryLevel < 20 
                    ? 'bg-red-500' 
                    : batteryLevel < 40 
                      ? 'bg-amber-500' 
                      : 'bg-foreground/70'
                }`}
                style={{ width: `${batteryLevel}%`, maxWidth: 'calc(100% - 2px)' }}
                animate={batteryLevel < 20 ? {
                  opacity: [1, 0.6, 1]
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="w-0.5 h-1 bg-foreground/70 absolute -right-0.5"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content with padding for status bar and bottom nav */}
      <main 
        className="container px-4 pt-10 pb-24 perspective-1000 overflow-auto"
        style={{ height: 'calc(100vh - 0px)' }} // Adjust for full-height mobile app feel
        ref={mainRef}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator with dynamic progress */}
        <motion.div 
          className="w-full flex flex-col items-center mb-2 pb-1 pt-1"
          animate={{
            opacity: refreshProgress > 0 ? 1 : 0,
            y: refreshProgress > 0 ? 0 : -20
          }}
        >
          {isRefreshing ? (
            <motion.div 
              className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ) : (
            <motion.div 
              className="h-1 rounded-full bg-primary/20"
              style={{ width: `${Math.max(15, refreshProgress / 5)}px` }}
            />
          )}
          {refreshProgress > 50 && (
            <motion.div 
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {isRefreshing ? "Refreshing..." : "Release to refresh"}
            </motion.div>
          )}
        </motion.div>
        
        {/* Page content with 3D perspective effect */}
        <motion.div
          className="w-full"
          style={{ 
            perspective: "1000px",
            rotateX: springRotateX,
            rotateY: springRotateY,
            transformStyle: "preserve-3d"
          }}
        >
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
        </motion.div>
        
        {/* Screen edge highlights for 3D effect */}
        <div className="pointer-events-none fixed inset-0 max-w-md mx-auto">
          <motion.div 
            className="absolute inset-0 rounded-3xl"
            style={{
              background: `
                radial-gradient(
                  circle at ${mouseX.get()}px ${mouseY.get()}px, 
                  rgba(var(--primary-rgb) / 0.15) 0%, 
                  transparent 70%
                )
              `,
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.05)',
              pointerEvents: 'none'
            }}
          />
          
          {/* Screen reflections and glare */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-black/5 opacity-50 pointer-events-none"></div>
          
          {/* Device frame bezel */}
          <div className="absolute inset-0 rounded-3xl border border-black/10 pointer-events-none"></div>
        </div>
      </main>
      
      {/* Mobile navigation bar */}
      <MobileNavbar />
      
      {/* Simulated home bar indicator like iOS */}
      <div className="h-1 w-32 bg-gray-700/30 rounded-full mx-auto my-2 absolute bottom-1 left-1/2 transform -translate-x-1/2"></div>
    </div>
  );
}