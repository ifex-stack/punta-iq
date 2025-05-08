import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Pin, Sparkles, Check, Search } from 'lucide-react';
import { SPORTS_LIST, POPULAR_SPORTS, type Sport } from '@/lib/sports-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedBackground } from '@/components/ui/animated-background';

interface EnhancedSportSelectorProps {
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  className?: string;
  showAll?: boolean;
  showPopularOnly?: boolean;
  favoriteSports?: string[];
  onToggleFavorite?: (sportId: string) => void;
  maxVisible?: number;
  animateSelection?: boolean;
  appearance?: 'default' | 'minimal' | 'pills' | '3d';
}

export function EnhancedSportSelector({ 
  selectedSport,
  onSelectSport,
  className,
  showAll = true,
  showPopularOnly = false,
  favoriteSports = [],
  onToggleFavorite,
  maxVisible = 0, // 0 means show all based on container width
  animateSelection = true,
  appearance = 'default'
}: EnhancedSportSelectorProps) {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [displayedSports, setDisplayedSports] = useState<Sport[]>([]);
  const [filteredSports, setFilteredSports] = useState<Sport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter sports based on props and favorites
  useEffect(() => {
    let sportsList = showPopularOnly ? POPULAR_SPORTS : SPORTS_LIST;
    
    if (!showAll) {
      sportsList = sportsList.filter(sport => sport.id !== 'all');
    }
    
    // Sort favoriteSports to the front
    if (favoriteSports.length > 0) {
      sportsList = [
        ...sportsList.filter(s => favoriteSports.includes(s.id)),
        ...sportsList.filter(s => !favoriteSports.includes(s.id))
      ];
    }
    
    setDisplayedSports(sportsList);
    setFilteredSports(sportsList);
  }, [showAll, showPopularOnly, favoriteSports]);

  // Filter sports based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSports(displayedSports);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = displayedSports.filter(
      sport => sport.label.toLowerCase().includes(query)
    );
    
    setFilteredSports(filtered);
  }, [searchQuery, displayedSports]);

  // Recalculate visible items when container resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [containerRef.current]);

  // Calculate how many items can be shown
  const calculateVisibleCount = () => {
    if (maxVisible > 0) return maxVisible;
    
    // Auto-calculate based on container width and appearance
    let itemWidth = 120; // default
    
    switch (appearance) {
      case 'minimal': itemWidth = 80; break;
      case 'pills': itemWidth = 100; break;
      case '3d': itemWidth = 140; break;
      default: itemWidth = 120;
    }
    
    return Math.floor(containerWidth / itemWidth) || 5;
  };

  const visibleCount = calculateVisibleCount();
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + visibleCount < filteredSports.length;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setStartIndex(Math.max(0, startIndex - Math.floor(visibleCount / 2)));
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setStartIndex(Math.min(filteredSports.length - visibleCount, startIndex + Math.floor(visibleCount / 2)));
    }
  };

  // Visible sports based on current index
  const visibleSports = filteredSports.slice(startIndex, startIndex + visibleCount);

  // Variants for animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", damping: 12, stiffness: 200 }
    }
  };

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
        <motion.div 
          ref={containerRef}
          className={cn(
            "flex items-center space-x-3 overflow-hidden px-8 py-2 mx-auto w-full justify-center"
          )}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence initial={false} mode="sync">
            {visibleSports.map((sport) => {
              const isSelected = selectedSport === sport.id;
              const isFavorite = favoriteSports.includes(sport.id);
              const IconComponent = sport.icon;
              
              return (
                <SportButton 
                  key={sport.id}
                  label={sport.label}
                  icon={<IconComponent className="mr-1 h-4 w-4" />}
                  isSelected={isSelected}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(sport.id) : undefined}
                  onClick={() => onSelectSport(sport.id)}
                  animate={animateSelection}
                  appearance={appearance}
                  variants={itemVariants}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
        
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
        
        {/* Filter button */}
        <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-[-40px] p-1 ml-2 rounded-full"
            >
              <Sparkles className="h-4 w-4" />
              <span className="sr-only">Filter Sports</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">Choose Sports</DialogTitle>
            </DialogHeader>
            <div className="relative w-full mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[50vh] mt-2">
              <div className="grid grid-cols-2 gap-2">
                {filteredSports.map(sport => (
                  <SportFilterItem
                    key={sport.id}
                    sport={sport}
                    isSelected={selectedSport === sport.id}
                    isFavorite={favoriteSports.includes(sport.id)}
                    onSelect={() => {
                      onSelectSport(sport.id);
                      setShowFilterDialog(false);
                    }}
                    onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(sport.id) : undefined}
                  />
                ))}
              </div>
            </ScrollArea>
            <DialogClose asChild>
              <Button className="w-full mt-4" variant="default">Done</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface SportButtonProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick: () => void;
  animate?: boolean;
  appearance?: 'default' | 'minimal' | 'pills' | '3d';
  variants?: any;
}

const SportButton = ({ 
  label, 
  icon, 
  isSelected, 
  isFavorite = false,
  onToggleFavorite,
  onClick,
  animate = true,
  appearance = 'default',
  variants
}: SportButtonProps) => {
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

  // Apply different styles based on appearance
  const getButtonClasses = () => {
    const baseClasses = "flex items-center whitespace-nowrap focus:outline-none transition-colors shadow-sm";
    
    switch (appearance) {
      case 'minimal':
        return cn(baseClasses, "rounded-full p-2", isSelected 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground hover:bg-muted/80");
      
      case 'pills':
        return cn(baseClasses, "rounded-full px-3 py-1 text-xs font-medium", isSelected 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground hover:bg-muted/80");
          
      case '3d':
        return cn(baseClasses, "rounded-lg px-4 py-2 text-sm font-medium border", isSelected 
          ? "bg-primary text-primary-foreground border-primary/50 shadow-lg" 
          : "bg-muted text-muted-foreground border-muted/20 hover:bg-muted/80");
          
      default: // default
        return cn(baseClasses, "rounded-full px-4 py-1.5 text-xs font-medium", isSelected 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground hover:bg-muted/80");
    }
  };
  
  // Only show label for certain appearances
  const showLabel = appearance !== 'minimal';
  
  // Add 3D effect for the 3d appearance
  const motion3dProps = appearance === '3d' ? {
    whileHover: { y: -3, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" },
    initial: { y: 0 },
  } : {};

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            className={cn(
              getButtonClasses(),
              isFavorite && "ring-1 ring-primary/30"
            )}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
            animate={animate ? (isSelected ? "selected" : "deselected") : undefined}
            variants={variants || buttonVariants}
            {...motion3dProps}
          >
            {icon}
            {showLabel && <span className="ml-1">{label}</span>}
            
            {onToggleFavorite && (
              <motion.button
                className={cn(
                  "ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100",
                  isFavorite && "opacity-100 text-primary"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
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
          {isFavorite && <p className="text-xs text-muted-foreground">Favorited</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface SportFilterItemProps {
  sport: Sport;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite?: () => void;
}

const SportFilterItem = ({
  sport,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite
}: SportFilterItemProps) => {
  const IconComponent = sport.icon;
  
  return (
    <motion.div
      className={cn(
        "flex items-center justify-between p-2 rounded-md cursor-pointer",
        isSelected ? "bg-primary/10" : "hover:bg-muted/60"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
    >
      <div className="flex items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center mr-2",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <IconComponent className="h-4 w-4" />
        </div>
        <span className="font-medium text-sm">{sport.label}</span>
      </div>
      
      <div className="flex items-center space-x-1">
        {isSelected && (
          <Check className="h-4 w-4 text-primary" />
        )}
        
        {onToggleFavorite && (
          <motion.button
            className={cn(
              "p-1 rounded-full",
              isFavorite ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Pin className="h-3 w-3" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedSportSelector;