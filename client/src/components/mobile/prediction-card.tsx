import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookmarkIcon, 
  CheckIcon, 
  XIcon,
  AlertCircleIcon,
  TimerIcon,
  TrendingUpIcon,
  PercentIcon,
  ChevronRightIcon
} from 'lucide-react';

interface PredictionCardProps {
  id?: number;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  sport?: string;
  prediction?: string;
  market?: string;
  odds?: number;
  confidence?: number;
  // Support both date string format (ISO) and Date object
  date?: string | Date;
  startTime?: string | Date;
  isCorrect?: boolean | null;
  isPremium?: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: number) => void;
  onSelect?: (id: number) => void;
  className?: string;
  compact?: boolean;
}

export function PredictionCard({
  id,
  homeTeam,
  awayTeam,
  league,
  sport,
  prediction,
  market = 'Match Result',
  odds = 1.5,
  confidence = 70,
  date,
  startTime,
  isCorrect,
  isPremium = false,
  isSaved = false,
  onToggleSave,
  onSelect,
  className,
  compact = false,
}: PredictionCardProps) {
  
  // Format date - handle both date formats and provide error handling
  let matchDate: Date;
  try {
    // First use date prop if it exists, otherwise use startTime
    const dateValue = date || startTime;
    
    // Handle different date formats
    if (dateValue instanceof Date) {
      matchDate = dateValue;
    } else {
      matchDate = new Date(dateValue || Date.now());
    }
    
    // Validate the date
    if (isNaN(matchDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch (error) {
    // If date is invalid, use current date as fallback
    matchDate = new Date();
  }
  
  // Format with consistent patterns
  const formattedTime = format(matchDate, 'HH:mm');
  const formattedDate = format(matchDate, 'dd MMM');
  
  // Determine status
  const isPending = isCorrect === null || isCorrect === undefined;
  const isWon = isCorrect === true;
  const isLost = isCorrect === false;
  
  // Determine confidence color
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-500';
    if (conf >= 65) return 'bg-lime-500';
    if (conf >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave && id) onToggleSave(id);
  };
  
  const handleCardClick = () => {
    if (onSelect && id) onSelect(id);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
      layout
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.97 }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden border bg-card transition-all touch-manipulation",
          "hover:bg-card/95 hover:shadow-lg active:shadow-sm",
          "transform perspective-1000 hover:translate-y-[-2px]",
          compact ? "shadow-sm" : "shadow-md"
        )}
        onClick={handleCardClick}
        style={{
          transformStyle: "preserve-3d"
        }}
      >
        {/* Premium badge with 3D effect */}
        {isPremium && (
          <motion.div 
            className="absolute top-0 right-0 z-10"
            initial={{ rotate: 0, scale: 1 }}
            animate={{ 
              rotate: [0, -2, 2, -2, 0],
              scale: [1, 1.05, 1],
              y: [0, -2, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 5,
              ease: "easeInOut" 
            }}
          >
            <Badge 
              variant="premium" 
              className="rounded-bl-md rounded-tr-md rounded-br-none rounded-tl-none shadow-md"
              style={{
                background: "linear-gradient(135deg, #7928CA, #FF0080)",
                textShadow: "0 1px 2px rgba(0,0,0,0.2)"
              }}
            >
              PRO
            </Badge>
          </motion.div>
        )}
        
        <CardContent className={cn(
          "p-3",
          compact ? "space-y-1" : "space-y-2"
        )}>
          {/* Header with league and time */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {league && (
              <div className="font-medium truncate">{league}</div>
            )}
            <div className="flex items-center space-x-1 ml-auto">
              <TimerIcon size={12} className="text-muted-foreground" />
              <span>{formattedTime}</span>
              <span className="opacity-60 px-1">|</span>
              <span>{formattedDate}</span>
            </div>
          </div>
          
          {/* Teams */}
          <div className="flex items-center justify-between font-medium relative">
            <div className="truncate mr-2">{homeTeam}</div>
            {/* VS badge with 3D effect */}
            <motion.div
              className="text-xs text-muted-foreground bg-muted px-1.5 rounded-full shadow-sm absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
              animate={{
                y: [0, -1, 0, 1, 0],
                rotateZ: [0, -1, 0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              vs
            </motion.div>
            <div className="truncate ml-2 text-right">{awayTeam}</div>
          </div>
          
          {/* Prediction info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Badge variant={
                isPending ? "outline" : 
                isWon ? "success" : 
                "destructive"
              } className="text-xs font-normal">
                {isPending && "Pending"}
                {isWon && "Won"}
                {isLost && "Lost"}
              </Badge>
              
              <div className="flex items-center">
                <Badge variant="secondary" className="text-xs font-normal">
                  {market}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!compact && odds && (
                <div className="flex items-center text-xs">
                  <TrendingUpIcon size={14} className="mr-1 text-muted-foreground" />
                  <span className="font-medium">{odds.toFixed(2)}</span>
                </div>
              )}
              
              {confidence && (
                <div className="flex items-center">
                  <motion.div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white",
                      "shadow-md backdrop-blur-sm",
                      getConfidenceColor(confidence)
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    animate={{ 
                      boxShadow: [
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1)", 
                        "0 6px 12px -1px rgba(0, 0, 0, 0.15)", 
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      ],
                      y: [0, -2, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      repeatDelay: 2
                    }}
                    style={{
                      transform: "perspective(800px) rotateX(5deg)",
                    }}
                  >
                    <span className="drop-shadow-sm">{confidence}%</span>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
          
          {/* Prediction */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {prediction || 'Home Win'}
            </div>
            
            {/* Touch-enhanced actions */}
            <div className="flex items-center space-x-1">
              {onToggleSave && id && (
                <motion.button
                  className={cn(
                    "p-2 rounded-full",
                    isSaved ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={handleSave}
                  whileTap={{ scale: 0.9 }}
                >
                  <BookmarkIcon size={16} className={cn(
                    isSaved ? "fill-primary" : "fill-none"
                  )} />
                </motion.button>
              )}
              
              <motion.button 
                className="p-2 rounded-full text-muted-foreground"
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRightIcon size={16} />
              </motion.button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default PredictionCard;