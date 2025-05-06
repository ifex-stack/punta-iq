import React from 'react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionCardProps {
  homeTeam: string;
  awayTeam: string;
  league?: string;
  date: string; // ISO string
  odds: number;
  prediction: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onClick?: () => void;
  isCompact?: boolean;
  className?: string;
}

export function PredictionCard({
  homeTeam,
  awayTeam,
  league,
  date,
  odds,
  prediction,
  isSaved = false,
  onToggleSave,
  onClick,
  isCompact = false,
  className
}: PredictionCardProps) {
  // Format the date
  const formattedDate = format(new Date(date), 'MMM d');
  
  return (
    <div 
      className={cn(
        "border rounded-lg p-3 bg-card relative",
        onClick && "cursor-pointer hover:border-primary transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {league && (
            <div className="text-xs text-muted-foreground mb-1">{league} · {formattedDate}</div>
          )}
          
          <div className="text-sm font-medium mb-1">
            {homeTeam} vs. {awayTeam}
          </div>
          
          <div className="flex items-center mt-2 gap-2">
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary">
              {prediction}
            </Badge>
            
            <span className="text-sm font-bold">
              {odds.toFixed(2)}
            </span>
          </div>
        </div>
        
        {onToggleSave && (
          <div 
            className="ml-2" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
          >
            <Heart 
              className={cn(
                "h-5 w-5 transition-colors", 
                isSaved ? "fill-destructive text-destructive" : "text-muted-foreground"
              )} 
            />
          </div>
        )}
        
        {!onToggleSave && (
          <div className="ml-2">
            <Checkbox checked={isSaved} className="pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictionCard;