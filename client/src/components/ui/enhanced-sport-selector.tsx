import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPORTS_LIST, POPULAR_SPORTS, getSportById } from '@/lib/sports-data';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star, StarOff, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

export function EnhancedSportSelector({
  selectedSports,
  onSportToggle,
  multiple = true,
  mode = 'default',
  className,
  maxDisplay,
  showFavorites = true,
  favoritesOnly = false,
  onToggleFavoritesOnly
}: EnhancedSportSelectorProps) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['football', 'basketball']);
  const [scrollAmount, setScrollAmount] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Filter sports based on favorites mode
  const displaySports = favoritesOnly 
    ? SPORTS_LIST.filter(sport => favoriteIds.includes(sport.id) && sport.id !== 'all')
    : SPORTS_LIST.filter(sport => sport.id !== 'all');
  
  // Scroll handler
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setScrollAmount(scrollLeft);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
  };
  
  // Initialize scroll state and add resize listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      setContainerWidth(scrollContainer.clientWidth);
      setScrollWidth(scrollContainer.scrollWidth);
      handleScroll();
      
      const resizeObserver = new ResizeObserver(() => {
        setContainerWidth(scrollContainer.clientWidth);
        setScrollWidth(scrollContainer.scrollWidth);
        handleScroll();
      });
      
      resizeObserver.observe(scrollContainer);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
      };
    }
  }, [favoritesOnly, displaySports.length]);
  
  // Scroll handlers
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };
  
  // Favorite handlers
  const toggleFavorite = (sportId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the sport toggle
    
    setFavoriteIds(current => {
      if (current.includes(sportId)) {
        return current.filter(id => id !== sportId);
      } else {
        return [...current, sportId];
      }
    });
  };
  
  // Style variants based on mode
  const getSportItemStyles = (sportId: string) => {
    const isSelected = selectedSports.includes(sportId);
    const sport = getSportById(sportId);
    const sportColor = sport?.color || '#666';
    
    const baseClasses = "flex items-center transition-all duration-300 cursor-pointer";
    
    // Default color classes for different states
    const unselectedClasses = "text-muted-foreground border-muted-foreground/30 bg-muted/20";
    const selectedClasses = `border-${sportId} text-${sportId} bg-${sportId}/10`;
    
    // Apply mode-specific styling
    switch (mode) {
      case 'compact':
        return cn(
          baseClasses,
          "px-2 py-1 rounded-md text-xs border",
          isSelected ? selectedClasses : unselectedClasses,
          isSelected && "font-medium"
        );
        
      case 'pills':
        return cn(
          baseClasses,
          "px-3 py-1.5 rounded-full text-sm border shadow-sm",
          isSelected 
            ? `bg-${sportId} border-${sportId} text-white font-medium`
            : "bg-muted/30 text-muted-foreground border-transparent"
        );
        
      case '3d':
        return cn(
          baseClasses,
          "px-3 py-2 rounded-md text-sm border transform transition-all perspective-800",
          isSelected 
            ? `bg-gradient-to-b from-${sportId}/80 to-${sportId} border-${sportId}/80 text-white font-medium shadow-md scale-105 -translate-y-1`
            : "bg-gradient-to-b from-muted/60 to-muted/30 text-muted-foreground border-muted/20",
        );
        
      case 'default':
      default:
        return cn(
          baseClasses,
          "px-3 py-2 rounded-md text-sm border",
          isSelected 
            ? `border-${sportId} bg-${sportId}/10 text-${sportId} font-medium`
            : unselectedClasses
        );
    }
  };
  
  // Get custom color styles for a sport
  const getSportInlineStyles = (sportId: string) => {
    const isSelected = selectedSports.includes(sportId);
    const sport = getSportById(sportId);
    const sportColor = sport?.color || '#666';
    
    // Base styles for all modes
    const baseStyles = {};
    
    // Mode-specific custom styles (that can't be handled by Tailwind classes)
    switch (mode) {
      case 'compact':
        return {
          ...baseStyles,
          ...(isSelected && { borderColor: sportColor, color: sportColor }),
        };
        
      case 'pills':
        return {
          ...baseStyles,
          ...(isSelected && { backgroundColor: sportColor, borderColor: sportColor }),
        };
        
      case '3d':
        return {
          ...baseStyles,
          ...(isSelected && { 
            background: `linear-gradient(to bottom, ${sportColor}CC, ${sportColor})`,
            borderColor: `${sportColor}CC`
          }),
        };
        
      case 'default':
      default:
        return {
          ...baseStyles,
          ...(isSelected && { borderColor: sportColor, color: sportColor }),
        };
    }
  };
  
  // Icon wrapper style based on mode
  const getIconWrapperStyle = (sportId: string) => {
    const isSelected = selectedSports.includes(sportId);
    const sport = getSportById(sportId);
    const sportColor = sport?.color || '#666';
    
    switch (mode) {
      case 'compact':
        return cn(
          "mr-1",
          isSelected && `text-${sportId}`
        );
        
      case 'pills':
        return cn(
          "mr-1.5",
          isSelected ? "text-white" : "text-muted-foreground"
        );
        
      case '3d':
        return cn(
          "mr-1.5 transition-transform",
          isSelected ? "text-white scale-110" : "text-muted-foreground"
        );
        
      case 'default':
      default:
        return cn(
          "mr-2",
          isSelected && `text-${sportId}`
        );
    }
  };
  
  // Custom inline styles for icon wrapper
  const getIconWrapperInlineStyle = (sportId: string) => {
    const isSelected = selectedSports.includes(sportId);
    const sport = getSportById(sportId);
    const sportColor = sport?.color || '#666';
    
    switch (mode) {
      case 'compact':
        return isSelected ? { color: sportColor } : {};
        
      case 'default':
      default:
        return isSelected ? { color: sportColor } : {};
    }
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Sports List with Horizontal Scrolling */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto py-2 px-1 scrollbar-hide -mx-1 snap-x"
        >
          <AnimatePresence>
            {displaySports.map(sport => {
              const isSelected = selectedSports.includes(sport.id);
              const isFavorite = favoriteIds.includes(sport.id);
              const sportStyle = getSportItemStyles(sport.id);
              const inlineStyles = getSportInlineStyles(sport.id);
              const iconWrapperStyle = getIconWrapperStyle(sport.id);
              const iconInlineStyles = getIconWrapperInlineStyle(sport.id);
              const Icon = sport.icon;
              
              return (
                <motion.div
                  key={sport.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="px-1 snap-start"
                >
                  <div 
                    className={`relative group ${sportStyle}`}
                    style={inlineStyles}
                    onClick={() => onSportToggle(sport.id)}
                  >
                    <div className={iconWrapperStyle} style={iconInlineStyles}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{sport.label}</span>
                    
                    {/* Favorite Star (only shown when showFavorites is enabled) */}
                    {showFavorites && (
                      <motion.button
                        onClick={(e) => toggleFavorite(sport.id, e)}
                        className={cn(
                          "ml-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100",
                          isFavorite && "opacity-100"
                        )}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFavorite ? (
                          <Star className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5" />
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        {/* Scroll Shadow Indicators */}
        <div className={cn(
          "absolute top-0 left-0 h-full w-12 pointer-events-none",
          "bg-gradient-to-r from-background to-transparent",
          !canScrollLeft && "opacity-0"
        )} />
        
        <div className={cn(
          "absolute top-0 right-0 h-full w-12 pointer-events-none",
          "bg-gradient-to-l from-background to-transparent",
          !canScrollRight && "opacity-0"
        )} />
        
        {/* Scroll Controls */}
        {canScrollLeft && (
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 shadow-md"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        {canScrollRight && (
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 shadow-md"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Favorites Toggle */}
      {showFavorites && onToggleFavoritesOnly && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavoritesOnly}
                className="absolute -top-1 -right-1 h-7 w-7 rounded-full"
              >
                {favoritesOnly ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{favoritesOnly ? "Show all sports" : "Show favorites only"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default EnhancedSportSelector;