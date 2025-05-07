import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingUp, LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SimplePredictionCardProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  odds: number;
  prediction: string;
  sport?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onClick?: () => void;
  className?: string;
}

// Simplified version of the prediction card for use in history and other pages
export function SimplePredictionCard({
  homeTeam,
  awayTeam,
  league,
  date,
  odds,
  prediction,
  sport = 'football',
  className,
  onClick
}: SimplePredictionCardProps) {
  // Format date if it's a string
  const formattedDate = typeof date === 'string' 
    ? new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : date;
  
  // Get sport-specific icon
  const getSportIcon = (sportName: string): LucideIcon => {
    // Default to TrendingUp if sport is undefined
    if (!sportName) return TrendingUp;
    
    // Sport-specific icons (simplified to always return TrendingUp for now)
    return TrendingUp;
  };
  
  const SportIcon = getSportIcon(sport);
  
  // Animation variants for the card
  const cardVariants = {
    initial: { 
      scale: 0.98,
      y: 10,
      opacity: 0 
    },
    animate: { 
      scale: 1,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    tap: { 
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    },
    hover: { 
      y: -5,
      transition: {
        duration: 0.2
      }
    }
  };
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileTap="tap"
      whileHover="hover"
      variants={cardVariants}
      className={cn("transform perspective-1000", className)}
      onClick={onClick}
    >
      <Card className="overflow-hidden relative border shadow-md border-gray-200 shadow-gray-100">
        {/* Match header with teams */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <SportIcon size={12} />
              <span>{sport ? sport.charAt(0).toUpperCase() + sport.slice(1) : 'Football'}</span>
            </Badge>
            
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Calendar size={12} />
                <span>{formattedDate}</span>
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <div className="flex-1 truncate">
              <span className="font-semibold text-sm">{homeTeam}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex-1 truncate">
              <span className="font-semibold text-sm">{awayTeam}</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            {league}
          </div>
        </div>
        
        {/* Prediction and odds */}
        <div className="px-4 py-3 bg-muted/30">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground">Prediction</div>
              <div className="font-semibold text-sm">{prediction}</div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Odds</div>
              <div className="font-semibold text-sm">{typeof odds === 'number' ? odds.toFixed(2) : odds}</div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Default export to maintain compatibility
export default SimplePredictionCard;