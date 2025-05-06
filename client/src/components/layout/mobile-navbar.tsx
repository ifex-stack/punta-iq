import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { 
  Home, 
  Search, 
  BarChart2, 
  Bookmark, 
  User,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface MobileNavbarProps {
  activeTab: string;
}

export function MobileNavbar({ activeTab }: MobileNavbarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      href: '/',
    },
    {
      id: 'explore',
      icon: Search,
      label: 'Explore',
      href: '/explore',
    },
    {
      id: 'picks',
      icon: Bookmark,
      label: 'My Picks',
      href: '/my-picks',
    },
    {
      id: 'performance',
      icon: BarChart2,
      label: 'Stats',
      href: '/performance',
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      href: '/profile',
    },
  ];

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-50 px-1"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <Link key={item.id} href={item.href}>
              <a className="flex flex-col items-center justify-center w-16 h-full relative">
                <div className="relative flex flex-col items-center justify-center">
                  {isActive && (
                    <motion.div
                      className="absolute -top-5 w-8 h-1 bg-primary rounded-full"
                      layoutId="navbar-indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={20}
                    className={cn(
                      "mb-1",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px]",
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default MobileNavbar;