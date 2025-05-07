import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Heart, 
  TrendingUp, 
  Award, 
  Check, 
  X, 
  ChevronUp, 
  ChevronDown, 
  LucideIcon,
  DollarSign,
  Crown,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Prediction {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  date: string;
  time: string;
  prediction: string;
  confidence: number;
  odds: number;
  isPremium: boolean;
  isLive?: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: "scheduled" | "live" | "completed" | "cancelled";
  favorite?: boolean;
}

interface MobilePredictionCardProps {
  prediction: Prediction;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  className?: string;
}

// Enhanced 3D card with animations and mobile-first design
export function PredictionCard({ 
  prediction, 
  onFavoriteToggle,
  isFavorite = false,
  className 
}: MobilePredictionCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Format date
  const formattedDate = new Date(prediction.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  
  // Get sport-specific icon
  const getSportIcon = (sport: string): LucideIcon => {
    // You could replace this with actual sport-specific icons later
    switch (sport.toLowerCase()) {
      case 'football':
        return TrendingUp;
      case 'basketball':
        return TrendingUp;
      case 'tennis':
        return TrendingUp;
      default:
        return TrendingUp;
    }
  };
  
  const SportIcon = getSportIcon(prediction.sport);
  
  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };
  
  // Get confidence indicator color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };
  
  // Handle toggle favorite
  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(prediction.id);
    }
  };
  
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
  
  // Animation variants for premium badge
  const premiumBadgeVariants = {
    initial: {
      scale: 0.8,
      opacity: 0,
      rotate: -5
    },
    animate: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: 0.2,
        duration: 0.3,
        type: 'spring',
        stiffness: 200
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
    >
      <Card className={cn(
        "overflow-hidden relative border shadow-md", 
        {
          "border-primary/30 shadow-primary/10": prediction.isPremium,
          "border-gray-200 shadow-gray-100": !prediction.isPremium
        }
      )}>
        {/* Premium badge */}
        {prediction.isPremium && (
          <motion.div
            className="absolute -right-6 -top-1 rotate-45 z-10"
            variants={premiumBadgeVariants}
          >
            <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-8 py-1 text-xs shadow-md">
              PREMIUM
            </div>
          </motion.div>
        )}
        
        {/* Match header with teams */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <SportIcon size={12} />
              <span>{prediction.sport.charAt(0).toUpperCase() + prediction.sport.slice(1)}</span>
            </Badge>
            
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Calendar size={12} />
                <span>{formattedDate}</span>
              </Badge>
              
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock size={12} />
                <span>{prediction.time}</span>
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <div className="flex-1 truncate">
              <span className="font-semibold text-sm">{prediction.homeTeam}</span>
            </div>
            
            {prediction.status === 'live' || prediction.status === 'completed' ? (
              <div className="px-2 font-bold">
                {typeof prediction.homeScore === 'number' ? prediction.homeScore : '-'}
              </div>
            ) : (
              <div className="h-4 w-4"></div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex-1 truncate">
              <span className="font-semibold text-sm">{prediction.awayTeam}</span>
            </div>
            
            {prediction.status === 'live' || prediction.status === 'completed' ? (
              <div className="px-2 font-bold">
                {typeof prediction.awayScore === 'number' ? prediction.awayScore : '-'}
              </div>
            ) : (
              <div className="h-4 w-4"></div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            {prediction.league}
          </div>
        </div>
        
        {/* Prediction and confidence */}
        <div className="px-4 py-3 bg-muted/30">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground">Prediction</div>
              <div className="font-semibold text-sm">{prediction.prediction}</div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="font-semibold text-sm">{prediction.confidence}%</div>
              </div>
              
              <div className="h-8 w-8 rounded-full border-4 border-muted flex items-center justify-center" style={{ borderColor: getConfidenceColor(prediction.confidence) }}>
                <span className="text-xs font-bold">{prediction.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded details */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-3 border-t border-border/50"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Odds</div>
                <div className="font-semibold text-sm flex items-center">
                  <DollarSign size={14} className="inline mr-1 text-green-500" />
                  {prediction.odds.toFixed(2)}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-semibold text-sm flex items-center">
                  <span 
                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${getStatusColor(prediction.status)}`}
                  />
                  {prediction.status || 'Scheduled'}
                </div>
              </div>
              
              {prediction.isPremium && (
                <div className="col-span-2 mt-1">
                  <div className="text-xs text-muted-foreground">Premium Features</div>
                  <div className="text-xs flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-primary/5 gap-1">
                      <Crown size={10} className="text-amber-500" />
                      Advanced Analysis
                    </Badge>
                    <Badge variant="outline" className="bg-primary/5 gap-1">
                      <Zap size={10} className="text-amber-500" />
                      AI Boosted
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Actions footer */}
        <div className="px-4 py-2 border-t border-border/50 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 px-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp size={14} className="mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown size={14} className="mr-1" />
                More
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={isFavorite ? "default" : "outline"}
              size="icon"
              className={cn(
                "h-8 w-8",
                isFavorite ? "bg-red-500 text-white hover:bg-red-600" : "text-red-500 hover:text-red-600"
              )}
              onClick={handleFavoriteToggle}
            >
              <Heart size={16} className={cn(
                isFavorite ? "fill-current" : "stroke-current"
              )} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Default export to maintain compatibility
export default PredictionCard;