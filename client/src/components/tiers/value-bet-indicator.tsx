import React from 'react';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, BarChart4 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

// Value bet interface
export interface ValueBet {
  market: string;
  outcome: string;
  edge: number;
  odds: number;
  bookmaker: string;
  explanation: string;
  value?: 'low' | 'medium' | 'high';
  tier?: 'Tier 1' | 'Tier 2' | 'Tier 5' | 'Tier 10';
  isRecommended?: boolean;
}

interface ValueBetIndicatorProps {
  valueBet: ValueBet;
  showEdge?: boolean;
  showOdds?: boolean;
  showOutcome?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Get value level from edge percentage
function getValueLevel(edge: number): 'low' | 'medium' | 'high' {
  if (edge >= 10) return 'high';
  if (edge >= 5) return 'medium';
  return 'low';
}

// Get color scheme based on value level
function getValueColors(level: 'low' | 'medium' | 'high'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-900'
      };
    case 'medium':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-900'
      };
    case 'low':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-900'
      };
    default:
      return {
        bg: 'bg-muted/30',
        text: 'text-muted-foreground',
        border: 'border-muted'
      };
  }
}

// Get text description based on value level
function getValueText(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high':
      return 'High Value';
    case 'medium':
      return 'Medium Value';
    case 'low':
      return 'Slight Value';
    default:
      return '';
  }
}

export function ValueBetIndicator({
  valueBet,
  showEdge = true,
  showOdds = false,
  showOutcome = false,
  size = 'md',
  className
}: ValueBetIndicatorProps) {
  // Determine value level
  const valueLevel = valueBet.value || getValueLevel(valueBet.edge);
  
  // Get color scheme
  const colors = getValueColors(valueLevel);
  
  // Determine text size based on size prop
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // Icon sizes
  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  return (
    <div className={cn(
      "border rounded-md overflow-hidden",
      colors.border,
      className
    )}>
      <div className={cn(
        "p-2.5 flex items-center justify-between",
        colors.bg
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            colors.bg,
            "border-2",
            colors.border
          )}>
            <DollarSign className={cn(iconSizes[size], colors.text)} />
          </div>
          
          <div>
            <h4 className={cn("font-medium", textSizes[size])}>
              Value Bet Detected
            </h4>
            <p className={cn("text-xs text-muted-foreground")}>
              {valueBet.market}
              {showOutcome && ` - ${valueBet.outcome}`}
            </p>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={cn(
                  colors.bg,
                  colors.text,
                  "font-semibold border",
                  colors.border
                )}
              >
                {getValueText(valueLevel)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              <p className="text-sm text-muted-foreground">
                {valueBet.explanation}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {(showEdge || showOdds) && (
        <div className="p-2 border-t border-border flex items-center justify-between">
          {showEdge && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={cn("text-sm", colors.text, "font-medium")}>
                {valueBet.edge.toFixed(1)}% Edge
              </span>
            </div>
          )}
          
          {showOdds && (
            <div className="flex items-center gap-1.5">
              <BarChart4 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {valueBet.bookmaker}: <span className="font-bold">{valueBet.odds.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}