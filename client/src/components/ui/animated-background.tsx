import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AnimatedBackgroundProps {
  variant?: 'waves' | 'particles' | 'gradient';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
  colors?: string[];
  interactive?: boolean;
  children?: React.ReactNode;
}

export function AnimatedBackground({
  variant = 'gradient',
  intensity = 'medium',
  className,
  colors = ['#6366f1', '#8b5cf6', '#d946ef'],
  interactive = true,
  children,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Waves animation
  const WavesBackground = () => {
    // Scale the intensity
    const intensityMap = {
      low: { amplitude: 15, speed: 10, layers: 2 },
      medium: { amplitude: 25, speed: 15, layers: 3 },
      high: { amplitude: 35, speed: 20, layers: 4 }
    };
    
    const { amplitude, speed, layers } = intensityMap[intensity];
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: layers }).map((_, i) => {
          // Use index to create slightly different waves
          const delay = -i * 2;
          const opacity = 1 - (i * 0.2);
          const animationDuration = 10 - (i * 0.5);
          const waveColor = colors[i % colors.length];
          
          return (
            <motion.div
              key={i}
              className="absolute bottom-0 left-0 right-0 h-64"
              style={{
                opacity: opacity * 0.2,
                zIndex: -10 - i,
              }}
              initial={{ y: 60 }}
              animate={{
                y: [60, 40, 60],
              }}
              transition={{
                duration: animationDuration,
                delay,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
              >
                <motion.path
                  fill={waveColor}
                  initial={{ d: `M0,160 C320,${180 + amplitude},720,${140 - amplitude},1440,160 V320 H0 Z` }}
                  animate={{
                    d: [
                      `M0,160 C320,${180 + amplitude},720,${140 - amplitude},1440,160 V320 H0 Z`,
                      `M0,160 C320,${140 - amplitude},720,${180 + amplitude},1440,160 V320 H0 Z`,
                      `M0,160 C320,${180 + amplitude},720,${140 - amplitude},1440,160 V320 H0 Z`
                    ]
                  }}
                  transition={{
                    duration: 10 + i * 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
              </svg>
            </motion.div>
          );
        })}
      </div>
    );
  };
  
  // Particles animation
  const ParticlesBackground = () => {
    // Scale the intensity
    const intensityMap = {
      low: { count: 15, speed: 1.5, size: 3 },
      medium: { count: 30, speed: 2, size: 4 },
      high: { count: 50, speed: 2.5, size: 5 }
    };
    
    const { count, speed, size } = intensityMap[intensity];
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: count }).map((_, i) => {
          const randomX = Math.random() * 100;
          const randomY = Math.random() * 100;
          const randomDelay = -(Math.random() * 5);
          const randomDuration = 15 + (Math.random() * 30);
          const particleSize = size - (Math.random() * 2);
          const particleColor = colors[i % colors.length];
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: particleSize,
                height: particleSize,
                backgroundColor: particleColor,
                top: `${randomY}%`,
                left: `${randomX}%`,
                zIndex: -10,
              }}
              animate={{
                x: [
                  randomX < 50 ? '100px' : '-100px',
                  randomX < 50 ? '-100px' : '100px'
                ],
                y: [
                  randomY < 50 ? '100px' : '-100px',
                  randomY < 50 ? '-100px' : '100px'
                ],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: randomDuration,
                delay: randomDelay,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          );
        })}
      </div>
    );
  };
  
  // Gradient animation
  const GradientBackground = () => {
    // Scale the intensity
    const intensityMap = {
      low: { speed: 6, blur: 30 },
      medium: { speed: 4, blur: 60 },
      high: { speed: 2, blur: 100 }
    };
    
    const { speed, blur } = intensityMap[intensity];
    
    // Add more colors for a smoother gradient
    const extendedColors = colors.length < 3 ? [...colors, ...colors] : colors;
    
    return (
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: `blur(${blur}px)`,
          opacity: 0.15,
          zIndex: -10,
        }}
        animate={{
          background: [
            `linear-gradient(60deg, ${extendedColors.join(', ')})`,
            `linear-gradient(120deg, ${[...extendedColors].reverse().join(', ')})`,
            `linear-gradient(240deg, ${extendedColors.join(', ')})`,
            `linear-gradient(360deg, ${[...extendedColors].reverse().join(', ')})`,
            `linear-gradient(60deg, ${extendedColors.join(', ')})`,
          ]
        }}
        transition={{
          duration: speed * 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    );
  };
  
  // Interactive background effect (optional)
  useEffect(() => {
    if (!interactive || !containerRef.current) return;
    
    const container = containerRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { width, height, left, top } = container.getBoundingClientRect();
      
      // Calculate mouse position relative to the container
      const x = clientX - left;
      const y = clientY - top;
      
      // Calculate the position as a percentage of the container dimensions
      const xPercent = Math.round((x / width) * 100);
      const yPercent = Math.round((y / height) * 100);
      
      // Apply a subtle CSS variable update for custom effects
      container.style.setProperty('--mouse-x', `${xPercent}%`);
      container.style.setProperty('--mouse-y', `${yPercent}%`);
      
      // Add a subtle transform based on mouse position (if in high intensity)
      if (intensity === 'high') {
        const moveX = (xPercent - 50) * 0.03;
        const moveY = (yPercent - 50) * 0.03;
        container.style.transform = `perspective(1000px) rotateX(${-moveY}deg) rotateY(${moveX}deg) scale3d(1.02, 1.02, 1.02)`;
      }
    };
    
    // Reset transform on mouse leave
    const handleMouseLeave = () => {
      container.style.transform = '';
    };
    
    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive, intensity]);
  
  // Render the selected variant
  const renderBackground = () => {
    switch (variant) {
      case 'waves':
        return <WavesBackground />;
      case 'particles':
        return <ParticlesBackground />;
      case 'gradient':
      default:
        return <GradientBackground />;
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden transition-transform duration-300",
        interactive && "hover:z-10",
        className
      )}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      } as React.CSSProperties}
    >
      {renderBackground()}
      {children}
    </div>
  );
}

export default AnimatedBackground;