import React from 'react';
import { useLocation } from 'wouter';
import { Home, Search, BarChart3, Bookmark, ShoppingBag, User, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function MobileNavbar() {
  const [location, navigate] = useLocation();
  
  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      activeWhen: ['/'],
    },
    {
      label: 'History',
      href: '/history',
      icon: BarChart3,
      activeWhen: ['/history'],
    },
    {
      label: 'AI Builder',
      href: '/ai-accumulators',
      icon: Brain,
      activeWhen: ['/ai-accumulators'],
    },
    {
      label: 'Favorites',
      href: '/favorites',
      icon: Bookmark,
      activeWhen: ['/favorites'],
    },
    {
      label: 'Pricing',
      href: '/pricing',
      icon: ShoppingBag,
      activeWhen: ['/pricing', '/subscribe'],
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      activeWhen: ['/profile', '/settings', '/explore', '/prediction'],
    },
  ];
  
  // Check if the current location matches an "activeWhen" path
  const isActive = (paths: string[]) => {
    return paths.some(path => 
      path === '/' 
        ? location === '/' 
        : location.startsWith(path)
    );
  };

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/10 bg-background/80 backdrop-blur-lg px-2 py-2 shadow-lg"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{
        boxShadow: "0 -10px 20px rgba(0,0,0,0.05)",
        borderRadius: "20px 20px 0 0"
      }}
    >
      {/* Notch design for iPhone-like appearance */}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-36 h-1 bg-primary/20 rounded-full"></div>
      
      {/* Home indicator for more iOS-like appearance */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-background rounded-full"></div>
      
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const active = isActive(item.activeWhen);
            return (
              <motion.button
                key={item.href}
                className="flex flex-col items-center relative bg-transparent border-0 py-1 touch-manipulation"
                onClick={() => navigate(item.href)}
                whileTap={{ scale: 0.9, y: 2 }}
                whileHover={{ y: -3 }}
              >
                <motion.div 
                  className={cn(
                    "flex items-center justify-center h-12 w-12 rounded-full text-muted-foreground relative",
                    "border border-primary/10",
                    active 
                      ? "text-primary bg-gradient-to-br from-primary/10 to-primary/30" 
                      : "bg-background/90"
                  )}
                  initial={{ 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
                  }}
                  animate={{
                    boxShadow: active 
                      ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 0 15px rgba(0, 128, 255, 0.3)" 
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    y: active ? -5 : 0,
                    scale: active ? 1.05 : 1,
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 17 
                  }}
                  style={{ 
                    transform: active ? "perspective(800px) rotateX(-5deg)" : "perspective(800px) rotateX(0deg)",
                    transformStyle: "preserve-3d"
                  }}
                >
                  <motion.div
                    animate={{
                      scale: active ? 1.1 : 1,
                      y: active ? [-1, 1, -1] : 0,
                      rotate: active ? [0, -3, 3, -3, 0] : 0
                    }}
                    transition={{
                      y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                      rotate: { duration: 0.5, ease: "easeInOut" },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <item.icon 
                      size={22} 
                      className={cn(
                        active ? "drop-shadow-lg" : "",
                        "transition-all duration-300"
                      )} 
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </motion.div>
                  
                  {/* Glow effect */}
                  {active && (
                    <motion.div
                      layoutId="navbar-glow"
                      className="absolute inset-0 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="absolute inset-0 bg-primary/10 rounded-full"></div>
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </motion.div>
                  )}
                  
                  {/* Pulse effect for active item */}
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ 
                        scale: [0.8, 1.2, 0.8], 
                        opacity: [0.3, 0, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.div>
                
                <motion.span 
                  className={cn(
                    "text-[10px] mt-1 font-medium", 
                    active 
                      ? "text-primary font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70" 
                      : "text-muted-foreground"
                  )}
                  animate={{
                    scale: active ? 1.05 : 1
                  }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}