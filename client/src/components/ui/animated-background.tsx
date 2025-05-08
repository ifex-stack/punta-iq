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
  intensity = 'low',
  className,
  colors = ['#3b82f6', '#8b5cf6', '#6366f1'],
  interactive = false,
  children
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get intensity values based on setting
  const getIntensityValues = () => {
    switch (intensity) {
      case 'low': 
        return { 
          particleCount: 15, 
          particleSize: 3,
          animationSpeed: 0.5,
          waveAmplitude: 10,
          waveFrequency: 0.02
        };
      case 'medium': 
        return { 
          particleCount: 30, 
          particleSize: 4,
          animationSpeed: 1,
          waveAmplitude: 20,
          waveFrequency: 0.04
        };
      case 'high': 
        return { 
          particleCount: 50, 
          particleSize: 5,
          animationSpeed: 1.5,
          waveAmplitude: 35,
          waveFrequency: 0.06
        };
      default: 
        return { 
          particleCount: 30, 
          particleSize: 4,
          animationSpeed: 1,
          waveAmplitude: 20,
          waveFrequency: 0.04
        };
    }
  };

  // Initialize particles for particle variant
  useEffect(() => {
    if (variant !== 'particles' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const intensityValues = getIntensityValues();
    const particles: any[] = [];
    
    // Resize canvas to match container size
    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    
    // Create particles
    const createParticles = () => {
      for (let i = 0; i < intensityValues.particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * intensityValues.particleSize + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: (Math.random() - 0.5) * intensityValues.animationSpeed,
          speedY: (Math.random() - 0.5) * intensityValues.animationSpeed
        });
      }
    };
    
    // Animate particles
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        
        // Move particles
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Handle mouse move if interactive
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      particles.forEach(particle => {
        // Calculate distance from mouse
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Create repelling force
        if (distance < 50) {
          particle.speedX += dx / distance * -0.5;
          particle.speedY += dy / distance * -0.5;
        }
      });
    };
    
    window.addEventListener('resize', resizeCanvas);
    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    
    resizeCanvas();
    createParticles();
    let animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [variant, intensity, colors, interactive]);

  // Initialize waves for wave variant
  useEffect(() => {
    if (variant !== 'waves' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const intensityValues = getIntensityValues();
    let animationTime = 0;
    
    // Resize canvas to match container size
    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    
    // Animate waves
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
      });
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waves
      for (let w = 0; w < colors.length; w++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        for (let x = 0; x < canvas.width; x++) {
          const waveOffset = (w + 1) * 20;
          const y = canvas.height - 
            waveOffset + 
            Math.sin(x * intensityValues.waveFrequency + animationTime + w * 0.5) * 
            intensityValues.waveAmplitude;
          
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        
        const waveGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        waveGradient.addColorStop(0, colors[w % colors.length]);
        waveGradient.addColorStop(1, colors[(w + 1) % colors.length]);
        
        ctx.fillStyle = waveGradient;
        ctx.globalAlpha = 0.7 - (w * 0.15);
        ctx.fill();
      }
      
      animationTime += 0.01 * intensityValues.animationSpeed;
      animationId = requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', resizeCanvas);
    
    resizeCanvas();
    let animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [variant, intensity, colors]);

  // Render appropriate background based on variant
  const renderBackground = () => {
    switch (variant) {
      case 'particles':
      case 'waves':
        return (
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        );
      case 'gradient':
      default:
        // Create a gradient CSS that smoothly transitions between the colors
        const gradientColors = colors.map((color, index) => {
          const percent = Math.round((index / (colors.length - 1)) * 100);
          return `${color} ${percent}%`;
        }).join(', ');
        
        return (
          <motion.div 
            className="absolute inset-0 w-full h-full bg-opacity-40 bg-gradient-to-br"
            style={{ 
              background: `linear-gradient(135deg, ${gradientColors})`,
              opacity: 0.25
            }}
            animate={{
              opacity: [0.2, 0.35, 0.2],
              scale: [1, 1.02, 1],
              rotate: [0, 1, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg", 
        className
      )}
    >
      {renderBackground()}
      {/* Overlay with subtle blur for depth */}
      <div className="absolute inset-0 backdrop-blur-[0.5px] opacity-50" />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default AnimatedBackground;