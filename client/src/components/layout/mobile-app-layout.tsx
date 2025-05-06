import React, { ReactNode } from 'react';
import MobileNavbar from './mobile-navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface MobileAppLayoutProps {
  children: ReactNode;
}

export default function MobileAppLayout({ children }: MobileAppLayoutProps) {
  const [location] = useLocation();
  
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -10,
    }
  };
  
  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
  };
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 pt-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileNavbar />
    </div>
  );
}