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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-sm px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const active = isActive(item.activeWhen);
          return (
            <motion.button
              key={item.href}
              className="flex flex-col items-center py-1 relative bg-transparent border-0"
              onClick={() => navigate(item.href)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ y: -2 }}
            >
              <motion.div 
                className={cn(
                  "flex items-center justify-center h-12 w-12 rounded-full text-muted-foreground relative",
                  "shadow-lg border border-primary/10",
                  active && "text-primary bg-gradient-to-br from-primary/5 to-primary/20"
                )}
                initial={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                animate={{
                  boxShadow: active 
                    ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 0 12px rgba(0, 128, 255, 0.2)" 
                    : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  y: active ? -4 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={{
                    scale: active ? 1.1 : 1,
                    rotate: active ? [0, -5, 5, -5, 5, 0] : 0
                  }}
                  transition={{
                    rotate: { duration: 0.5, ease: "easeInOut" },
                    scale: { duration: 0.2 }
                  }}
                >
                  <item.icon size={22} className={active ? "drop-shadow-md" : ""} />
                </motion.div>
                {active && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-full"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
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
                  active ? "text-primary font-bold" : "text-muted-foreground"
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
    </nav>
  );
}