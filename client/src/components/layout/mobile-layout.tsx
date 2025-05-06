import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import MobileNavbar from './mobile-navbar';

interface MobileLayoutProps {
  children: ReactNode;
  activeTab: string;
  hideNavbar?: boolean;
  className?: string;
  fullHeight?: boolean;
}

export function MobileLayout({
  children,
  activeTab,
  hideNavbar = false,
  className,
  fullHeight = false
}: MobileLayoutProps) {
  return (
    <div 
      className={cn(
        "flex flex-col w-full min-h-screen h-full bg-background overflow-x-hidden", 
        className
      )}
    >
      <motion.main 
        className={cn(
          "flex-1 pb-16 overflow-x-hidden",
          fullHeight ? "h-full" : ""
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </motion.main>
      
      {!hideNavbar && (
        <MobileNavbar activeTab={activeTab} />
      )}
    </div>
  );
}

export default MobileLayout;