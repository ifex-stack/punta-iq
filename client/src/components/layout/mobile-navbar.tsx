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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background px-3 py-2">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const active = isActive(item.activeWhen);
          return (
            <button
              key={item.href}
              className="flex flex-col items-center py-1 relative bg-transparent border-0"
              onClick={() => navigate(item.href)}
            >
              <div className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground relative",
                active && "text-primary"
              )}>
                <item.icon size={20} />
                {active && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-full"
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium", 
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}