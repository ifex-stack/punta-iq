import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  className,
}: PredictionCardProps) {
  // Format date
  const formattedDate = format(parseISO(date), 'E, d MMM • HH:mm');
  
  // Format prediction nicely
  const formatPrediction = (pred: string) => {
    return pred
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Match info */}
          <div className="p-3 pb-2 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                {league && (
                  <Badge variant="outline" className="bg-background font-normal text-xs px-1.5 py-0">
                    {league}
                  </Badge>
                )}
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              
              <div className="text-sm font-medium">
                {homeTeam} vs {awayTeam}
              </div>
            </div>
            
            {onToggleSave && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave();
                }}
              >
                <Heart 
                  className={cn(
                    "h-4 w-4",
                    isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  )}
                />
              </Button>
            )}
          </div>
          
          {/* Prediction and odds */}
          <div className="flex items-center p-2 pt-0 pb-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded">
                {formatPrediction(prediction)}
              </div>
              <Badge variant="secondary" className="font-normal text-xs">
                {odds.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}