import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
}

export function PageTransition({
  children,
  className,
  duration = 0.6,
  delay = 0,
  direction = 'up'
}: PageTransitionProps) {
  // Set initial and animate values based on direction
  const getVariants = () => {
    switch (direction) {
      case 'up':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        };
      case 'left':
        return {
          hidden: { opacity: 0, x: 20 },
          visible: { opacity: 1, x: 0 }
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 }
        };
      case 'fade':
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };

  const variants = getVariants();

  return (
    <motion.div
      className={cn("w-full", className)}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variants}
      transition={{ 
        duration, 
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom easing curve for smooth feel
      }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;