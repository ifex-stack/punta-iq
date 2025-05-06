import React from 'react';
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  BarChart2,
  UserCircle,
  BookmarkIcon
} from "lucide-react";

interface MobileNavbarProps {
  activeTab: string;
}

export function MobileNavbar({ activeTab }: MobileNavbarProps) {
  // Navigation items
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/'
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Search,
      href: '/explore'
    },
    {
      id: 'picks',
      label: 'My Picks',
      icon: BookmarkIcon,
      href: '/my-picks'
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: BarChart2,
      href: '/performance'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCircle,
      href: '/profile'
    }
  ];

  // Helper to determine if a tab is active
  const isActive = (id: string) => activeTab === id;

  // Animation variants
  const navItemVariants = {
    active: { 
      scale: 1.1, 
      y: -4,
      transition: { type: "spring", stiffness: 400, damping: 15 } 
    },
    inactive: { 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 17 } 
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(item => (
          <Link key={item.id} href={item.href}>
            <div className="flex flex-col items-center justify-center h-full touch-manipulation active:opacity-70">
              <motion.div 
                className="relative flex flex-col items-center"
                initial="inactive"
                animate={isActive(item.id) ? "active" : "inactive"}
                variants={navItemVariants}
              >
                {isActive(item.id) && (
                  <motion.div 
                    className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="navIndicator"
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                  />
                )}
                
                <item.icon className={cn(
                  "h-5 w-5 mb-1",
                  isActive(item.id) ? "text-primary" : "text-muted-foreground"
                )} />
                
                <span className={cn(
                  "text-[10px]",
                  isActive(item.id) ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </motion.div>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default MobileNavbar;