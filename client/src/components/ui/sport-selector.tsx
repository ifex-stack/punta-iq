import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Pin, Filter, Sparkles } from 'lucide-react';
import { SPORTS_LIST, POPULAR_SPORTS } from '@/lib/sports-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface SportSelectorProps {
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  className?: string;
  showAll?: boolean;
  showPopularOnly?: boolean;
  maxVisible?: number;
  animateSelection?: boolean;
}

export function SportSelector({ 
  selectedSport, 
  onSelectSport, 
  className,
  showAll = true,
  showPopularOnly = false,
  maxVisible = 0, // 0 means show all
  animateSelection = true
}: SportSelectorProps) {
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [displayedSports, setDisplayedSports] = useState<typeof SPORTS_LIST>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [pinnedSports, setPinnedSports] = useState<string[]>([]);

  // Filter sports based on props
  useEffect(() => {
    let sportsList = showPopularOnly 
      ? POPULAR_SPORTS
      : SPORTS_LIST;
    
    if (!showAll) {
      sportsList = sportsList.filter(sport => sport.id !== 'all');
    }
    
    setDisplayedSports(sportsList);
  }, [showAll, showPopularOnly]);

  // Recalculate visible items when container resizes
  useEffect(() => {
    if (!containerRef) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef);
    
    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  // Calculate how many items we can show
  const calculateVisibleCount = () => {
    if (maxVisible > 0) return maxVisible;
    // Auto-calculate based on container width
    // Assuming each sport button is roughly 120px wide
    return Math.floor(containerWidth / 120) || 5;
  };

  const visibleCount = calculateVisibleCount();
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + visibleCount < displayedSports.length;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setStartIndex(Math.max(0, startIndex - Math.floor(visibleCount / 2)));
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setStartIndex(Math.min(displayedSports.length - visibleCount, startIndex + Math.floor(visibleCount / 2)));
    }
  };

  const togglePin = (sportId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPinnedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  // Visible sports based on current index and pinned status
  const visibleSports = (() => {
    // First show pinned sports
    const pinned = displayedSports.filter(s => pinnedSports.includes(s.id));
    
    // Then show others based on scroll position
    const notPinned = displayedSports.filter(s => !pinnedSports.includes(s.id));
    const remainingCount = visibleCount - pinned.length;
    
    if (remainingCount <= 0) {
      // If we have more pins than visible slots, just show pins
      return pinned.slice(0, visibleCount);
    }
    
    // Show pinned sports first, then fill remaining slots with scrollable sports
    return [
      ...pinned,
      ...notPinned.slice(startIndex, startIndex + remainingCount)
    ];
  })();

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center">
        {/* Left scroll button */}
        {canScrollLeft && (
          <motion.button
            className="absolute left-0 z-10 rounded-full bg-background/80 shadow-md p-1 backdrop-blur-sm"
            onClick={scrollLeft}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </motion.button>
        )}
        
        {/* Sports buttons container */}
        <div 
          ref={setContainerRef}
          className={cn(
            "flex items-center space-x-3 overflow-hidden px-8 py-2 mx-auto w-full justify-center"
          )}
        >
          <AnimatePresence initial={false} mode="sync">
            {visibleSports.map((sport) => {
              const isSelected = selectedSport === sport.id;
              const isPinned = pinnedSports.includes(sport.id);
              const Icon = sport.icon;
              
              return (
                <SportButton 
                  key={sport.id}
                  label={sport.label}
                  icon={<sport.icon className="mr-1 h-4 w-4" />}
                  isSelected={isSelected}
                  isPinned={isPinned}
                  onPin={(e) => togglePin(sport.id, e)}
                  onClick={() => onSelectSport(sport.id)}
                  animate={animateSelection}
                />
              );
            })}
          </AnimatePresence>
        </div>
        
        {/* Right scroll button */}
        {canScrollRight && (
          <motion.button
            className="absolute right-0 z-10 rounded-full bg-background/80 shadow-md p-1 backdrop-blur-sm"
            onClick={scrollRight}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </motion.button>
        )}
        
        {/* Filter toggle (optional) */}
        {displayedSports.length > visibleCount && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-[-36px] p-1"
            onClick={() => setShowFilterOptions(!showFilterOptions)}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Full sport list in filter dropdown (optional) */}
      {showFilterOptions && (
        <motion.div 
          className="absolute top-full left-0 right-0 mt-2 z-20 bg-card rounded-md shadow-lg p-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {displayedSports.map(sport => (
              <SportButton
                key={sport.id}
                label={sport.label}
                icon={<sport.icon className="mr-1 h-4 w-4" />}
                isSelected={selectedSport === sport.id}
                isPinned={pinnedSports.includes(sport.id)}
                onPin={(e) => togglePin(sport.id, e)}
                onClick={() => {
                  onSelectSport(sport.id);
                  setShowFilterOptions(false);
                }}
                animate={false}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface SportButtonProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  isPinned?: boolean;
  onPin?: (e: React.MouseEvent) => void;
  onClick: () => void;
  animate?: boolean;
}

function SportButton({ 
  label, 
  icon, 
  isSelected, 
  isPinned = false,
  onPin,
  onClick,
  animate = true
}: SportButtonProps) {
  const buttonVariants = {
    selected: {
      backgroundColor: "var(--primary)",
      color: "var(--primary-foreground)",
      scale: 1.05,
      transition: { type: "spring", stiffness: 300, damping: 15 }
    },
    deselected: {
      backgroundColor: "var(--muted)",
      color: "var(--muted-foreground)",
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 15 }
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            className={cn(
              "flex items-center rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap focus:outline-none transition-colors shadow-sm",
              isSelected 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              isPinned && "ring-1 ring-primary/30"
            )}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
            animate={animate ? (isSelected ? "selected" : "deselected") : undefined}
            variants={buttonVariants}
          >
            {icon}
            <span>{label}</span>
            
            {onPin && (
              <motion.button
                className={cn(
                  "ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100",
                  isPinned && "opacity-100 text-primary"
                )}
                onClick={onPin}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              >
                <Pin className="h-3 w-3" />
              </motion.button>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
          {isPinned && <p className="text-xs text-muted-foreground">Pinned</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SportSelector;