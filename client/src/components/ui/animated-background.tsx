import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  className?: string;
  variant?: 'default' | 'gradient' | 'particles' | 'waves';
  intensity?: 'light' | 'medium' | 'strong';
  interactive?: boolean;
}

export function AnimatedBackground({
  className = '',
  variant = 'default',
  intensity = 'medium',
  interactive = true,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic opacity based on intensity
  const getOpacity = () => {
    switch (intensity) {
      case 'light': return '0.05';
      case 'medium': return '0.1';
      case 'strong': return '0.15';
      default: return '0.1';
    }
  };
  
  // Generate blobs for the background
  const renderBlobs = () => {
    // Different blob configurations for different variants
    const blobsConfig = {
      default: [
        { size: '600px', position: '-5% -5%', color: 'from-primary/20 to-secondary/20' },
        { size: '500px', position: '95% 10%', color: 'from-accent/20 to-primary/20' },
        { size: '550px', position: '50% 100%', color: 'from-secondary/20 to-accent/20' },
      ],
      gradient: [
        { size: '800px', position: '0% 0%', color: 'from-primary/20 to-transparent' },
        { size: '700px', position: '100% 0%', color: 'from-accent/20 to-transparent' },
        { size: '800px', position: '50% 100%', color: 'from-secondary/20 to-transparent' },
      ],
      particles: [
        { size: '600px', position: '-5% -5%', color: 'from-primary/20 to-secondary/20' },
        { size: '500px', position: '95% 10%', color: 'from-accent/20 to-primary/20' },
        { size: '550px', position: '50% 100%', color: 'from-secondary/20 to-accent/20' },
      ],
      waves: [
        { size: '1200px', position: '0% 10%', color: 'from-primary/10 to-transparent' },
        { size: '1000px', position: '100% 30%', color: 'from-accent/10 to-transparent' },
        { size: '1100px', position: '40% 70%', color: 'from-secondary/10 to-transparent' },
      ],
    };
    
    const blobs = blobsConfig[variant] || blobsConfig.default;
    
    return blobs.map((blob, index) => (
      <motion.div
        key={`blob-${index}`}
        className={`absolute rounded-full bg-gradient-to-br ${blob.color} blur-3xl opacity-${getOpacity()}`}
        style={{ 
          width: blob.size, 
          height: blob.size, 
          left: blob.position.split(' ')[0], 
          top: blob.position.split(' ')[1],
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          x: [0, 5, 0],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 20 + index * 5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
    ));
  };
  
  // Generate particles for the particle variant
  const renderParticles = () => {
    if (variant !== 'particles') return null;
    
    const particles = Array.from({ length: 20 }).map((_, index) => (
      <motion.div
        key={`particle-${index}`}
        className="absolute rounded-full bg-primary/20"
        style={{ 
          width: Math.random() * 10 + 5 + 'px', 
          height: Math.random() * 10 + 5 + 'px',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: Math.random() * 5 + 5,
          repeat: Infinity,
          delay: Math.random() * 5,
        }}
      />
    ));
    
    return particles;
  };
  
  // Generate wave effect for the wave variant
  const renderWaves = () => {
    if (variant !== 'waves') return null;
    
    return (
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M 0 300 Q 300 200 600 300 Q 900 400 1200 300 L 1200 800 L 0 800 Z"
          fill="url(#wave-gradient-1)"
          animate={{
            d: [
              "M 0 300 Q 300 200 600 300 Q 900 400 1200 300 L 1200 800 L 0 800 Z",
              "M 0 350 Q 300 250 600 350 Q 900 450 1200 350 L 1200 800 L 0 800 Z",
              "M 0 300 Q 300 200 600 300 Q 900 400 1200 300 L 1200 800 L 0 800 Z",
            ]
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.path
          d="M 0 400 Q 300 300 600 400 Q 900 500 1200 400 L 1200 800 L 0 800 Z"
          fill="url(#wave-gradient-2)"
          animate={{
            d: [
              "M 0 400 Q 300 300 600 400 Q 900 500 1200 400 L 1200 800 L 0 800 Z",
              "M 0 450 Q 300 350 600 450 Q 900 550 1200 450 L 1200 800 L 0 800 Z",
              "M 0 400 Q 300 300 600 400 Q 900 500 1200 400 L 1200 800 L 0 800 Z",
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        />
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="var(--color-secondary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="var(--color-secondary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    );
  };
  
  // Interactive mouse movement effect
  useEffect(() => {
    if (!interactive || !containerRef.current) return;
    
    const container = containerRef.current;
    const blobs = container.querySelectorAll('.bg-gradient-to-br');
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      blobs.forEach((blob: Element, index: number) => {
        const factor = (index + 1) * 0.01;
        const offsetX = (x - centerX) * factor;
        const offsetY = (y - centerY) * factor;
        
        (blob as HTMLElement).style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      });
    };
    
    const handleMouseLeave = () => {
      blobs.forEach((blob: Element) => {
        (blob as HTMLElement).style.transform = 'translate(0px, 0px)';
      });
    };
    
    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive, variant]);
  
  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ zIndex: -1 }}
    >
      {renderBlobs()}
      {renderParticles()}
      {renderWaves()}
    </div>
  );
}