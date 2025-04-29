import React from 'react';
import { Lightbulb, BarChart4, Sparkles } from 'lucide-react';

interface PuntaIQLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function PuntaIQLogo({ size = 'md', showText = true, className = '' }: PuntaIQLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };
  
  const fontSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="relative flex items-center justify-center">
          <div className="absolute w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full opacity-90 blur-[2px]" />
          <div className="relative z-10 flex items-center justify-center p-1">
            <Lightbulb className={`${sizeClasses[size]} text-white`} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <Sparkles className={`${sizeClasses[size]} text-white`} strokeWidth={1.5} />
          </div>
        </div>
      </div>
      
      {showText && (
        <div className={`font-bold ${fontSize[size]} bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
          PuntaIQ
        </div>
      )}
    </div>
  );
}