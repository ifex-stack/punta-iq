import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Basketball, Football, Tennis, Baseball, Hockey, Golf, 
  Rugby, Cricket, Volleyball, Boxing, MoveHorizontal, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface EnhancedSportSelectorProps {
  selectedSports: string[];
  onSportToggle: (sport: string) => void;
  multiple?: boolean;
  mode?: 'default' | 'compact' | 'pills' | '3d';
  className?: string;
  maxDisplay?: number;
  showFavorites?: boolean;
  favoritesOnly?: boolean;
  onToggleFavoritesOnly?: () => void;
}

interface Sport {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
}

export function EnhancedSportSelector({
  selectedSports,
  onSportToggle,
  multiple = true,
  mode = 'default',
  className,
  maxDisplay = 20,
  showFavorites = false,
  favoritesOnly = false,
  onToggleFavoritesOnly
}: EnhancedSportSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Sports data with icons and colors
  const sports: Sport[] = [
    { 
      id: 'football', 
      name: 'Football', 
      icon: <Football size={mode === 'compact' ? 18 : 24} />, 
      color: '#4ade80', 
      backgroundColor: 'rgba(74, 222, 128, 0.1)' 
    },
    { 
      id: 'basketball', 
      name: 'Basketball', 
      icon: <Basketball size={mode === 'compact' ? 18 : 24} />, 
      color: '#f97316', 
      backgroundColor: 'rgba(249, 115, 22, 0.1)' 
    },
    { 
      id: 'tennis', 
      name: 'Tennis', 
      icon: <Tennis size={mode === 'compact' ? 18 : 24} />, 
      color: '#facc15', 
      backgroundColor: 'rgba(250, 204, 21, 0.1)' 
    },
    { 
      id: 'baseball', 
      name: 'Baseball', 
      icon: <Baseball size={mode === 'compact' ? 18 : 24} />, 
      color: '#14b8a6', 
      backgroundColor: 'rgba(20, 184, 166, 0.1)' 
    },
    { 
      id: 'hockey', 
      name: 'Hockey', 
      icon: <Hockey size={mode === 'compact' ? 18 : 24} />, 
      color: '#0ea5e9', 
      backgroundColor: 'rgba(14, 165, 233, 0.1)' 
    },
    { 
      id: 'golf', 
      name: 'Golf', 
      icon: <Golf size={mode === 'compact' ? 18 : 24} />, 
      color: '#a3e635', 
      backgroundColor: 'rgba(163, 230, 53, 0.1)' 
    },
    { 
      id: 'rugby', 
      name: 'Rugby', 
      icon: <Rugby size={mode === 'compact' ? 18 : 24} />, 
      color: '#8b5cf6', 
      backgroundColor: 'rgba(139, 92, 246, 0.1)' 
    },
    { 
      id: 'cricket', 
      name: 'Cricket', 
      icon: <Cricket size={mode === 'compact' ? 18 : 24} />, 
      color: '#ec4899', 
      backgroundColor: 'rgba(236, 72, 153, 0.1)' 
    },
    { 
      id: 'volleyball', 
      name: 'Volleyball', 
      icon: <Volleyball size={mode === 'compact' ? 18 : 24} />, 
      color: '#f43f5e', 
      backgroundColor: 'rgba(244, 63, 94, 0.1)' 
    },
    { 
      id: 'boxing', 
      name: 'Boxing', 
      icon: <Boxing size={mode === 'compact' ? 18 : 24} />, 
      color: '#6366f1', 
      backgroundColor: 'rgba(99, 102, 241, 0.1)' 
    },
  ];
  
  // Favorite sports (mock data - in a real app, this would come from user preferences)
  const [favoriteSports, setFavoriteSports] = useState<string[]>([
    'football', 'basketball', 'tennis'
  ]);
  
  // Toggle favorite status
  const toggleFavorite = (sportId: string) => {
    setFavoriteSports(prev => 
      prev.includes(sportId)
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };
  
  // Handle mouse events for dragging
  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };
  
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
  };
  
  const onMouseUpOrLeave = () => {
    setIsDragging(false);
  };
  
  // Touch events for mobile dragging
  const onTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };
  
  // Filter sports if showing favorites only
  const displayedSports = favoritesOnly
    ? sports.filter(sport => favoriteSports.includes(sport.id))
    : sports.slice(0, maxDisplay);
  
  // Render a sport item based on the selected mode
  const renderSportItem = (sport: Sport) => {
    const isSelected = selectedSports.includes(sport.id);
    const isFavorite = favoriteSports.includes(sport.id);
    
    // Different styles based on mode
    switch (mode) {
      case 'compact':
        return (
          <TooltipProvider key={sport.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "relative h-9 w-9 rounded-full",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onSportToggle(sport.id)}
                >
                  {sport.icon}
                  {showFavorites && isFavorite && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col items-center">
                  <span>{sport.name}</span>
                  {showFavorites && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 mt-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(sport.id);
                      }}
                    >
                      {isFavorite ? 'Remove favorite' : 'Add favorite'}
                    </Button>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        
      case 'pills':
        return (
          <Button
            key={sport.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 px-3 rounded-full flex items-center gap-1.5",
              isSelected && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSportToggle(sport.id)}
          >
            {sport.icon}
            <span className="text-sm font-medium">{sport.name}</span>
            {showFavorites && (
              <button 
                className="ml-1 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(sport.id);
                }}
              >
                <Star 
                  size={14} 
                  className={isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
                />
              </button>
            )}
          </Button>
        );
        
      case '3d':
        return (
          <motion.div
            key={sport.id}
            className={cn(
              "relative h-16 w-16 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-transform",
              isSelected ? "shadow-lg" : "shadow"
            )}
            style={{
              backgroundColor: isSelected ? sport.color : sport.backgroundColor,
              color: isSelected ? 'white' : sport.color,
            }}
            whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSportToggle(sport.id)}
            animate={{
              y: isSelected ? -5 : 0,
              boxShadow: isSelected
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="relative">
              {sport.icon}
              {showFavorites && isFavorite && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400" />
              )}
            </div>
            <span className="mt-1 text-xs font-medium">{sport.name}</span>
            {showFavorites && (
              <motion.button 
                className="absolute bottom-1 right-1 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(sport.id);
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Star 
                  size={12} 
                  className={isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
                />
              </motion.button>
            )}
          </motion.div>
        );
        
      default: // 'default' mode
        return (
          <Button
            key={sport.id}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "flex items-center gap-2 min-w-[120px]",
              isSelected && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSportToggle(sport.id)}
          >
            {sport.icon}
            <span>{sport.name}</span>
            {showFavorites && (
              <button 
                className="ml-auto focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(sport.id);
                }}
              >
                <Star 
                  size={16} 
                  className={isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
                />
              </button>
            )}
          </Button>
        );
    }
  };
  
  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  // Animation variants for individual items
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className={cn("select-none", className)}>
      {/* Favorites toggle button */}
      {showFavorites && onToggleFavoritesOnly && (
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex items-center gap-1"
            onClick={onToggleFavoritesOnly}
          >
            <Star size={14} className={favoritesOnly ? "fill-amber-400 text-amber-400" : ""} />
            {favoritesOnly ? 'Show all sports' : 'Show favorites only'}
          </Button>
        </div>
      )}
      
      {/* Horizontal scroll indicator */}
      {mode !== '3d' && (
        <div className="flex justify-end mb-1">
          <MoveHorizontal size={16} className="text-muted-foreground animate-pulse" />
        </div>
      )}
      
      {/* Sports container */}
      <div
        ref={containerRef}
        className={cn(
          "flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
          mode === '3d' ? "flex-wrap justify-center" : "flex-nowrap",
          isDragging && "cursor-grabbing",
          !isDragging && mode !== '3d' && "cursor-grab"
        )}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUpOrLeave}
      >
        <AnimatePresence mode="sync">
          <motion.div
            className={cn(
              "flex gap-2",
              mode === '3d' ? "flex-wrap justify-center" : "flex-nowrap"
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {displayedSports.map((sport) => (
              <motion.div key={sport.id} variants={itemVariants}>
                {renderSportItem(sport)}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default EnhancedSportSelector;