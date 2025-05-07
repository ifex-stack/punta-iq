import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 3500 }: SplashScreenProps) {
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        return newProgress <= 100 ? newProgress : 100;
      });
    }, duration / 50);
    
    // Redirect after duration
    const timeout = setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        navigate('/auth');
      }
    }, duration);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate, onComplete, duration]);
  
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-b from-primary-900 to-primary-950 flex flex-col items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center justify-center space-y-10 px-8 w-full">
        {/* App Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
        >
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-black/5 to-white/20"></div>
            
            {/* 3D Logo/Icon */}
            <motion.div
              animate={{ 
                rotateY: [0, 10, 0, -10, 0],
                rotateX: [0, -5, 0, 5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="text-white font-bold text-4xl"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 drop-shadow-lg">
                PuntaIQ
              </span>
            </motion.div>
            
            {/* Animated glow effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
        
        {/* App Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-white text-xl font-bold mb-2">AI-Powered Predictions</h1>
          <p className="text-white/80 text-sm">Smart sports analytics at your fingertips</p>
        </motion.div>
        
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, width: "80%" }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full max-w-xs"
        >
          <div className="bg-white/10 h-1 rounded-full w-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-white/70 text-xs">Loading...</p>
            <p className="text-white/70 text-xs">{progress}%</p>
          </div>
        </motion.div>
      </div>
      
      {/* Floating particles for background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-white/20"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 + 0.3,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -200 - 100],
              opacity: [null, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}