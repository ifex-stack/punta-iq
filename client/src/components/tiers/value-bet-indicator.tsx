import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TierLevel, getTierFromString } from './tier-badge';
import { BadgeCheck, TrendingUp } from 'lucide-react';

export interface ValueBet {
  outcome: string;
  odds: number;
  value: number;
  edge: number;
  tier: string;
  isRecommended: boolean;
}

const valueBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      value: {
        high: "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300",
        medium: "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300",
        low: "bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-300",
        none: "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300"
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1"
      }
    },
    defaultVariants: {
      value: "none",
      size: "md"
    }
  }
);

const edgeVariants = cva(
  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      edge: {
        high: "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300",
        medium: "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300",
        low: "bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-300",
        negative: "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300"
      },
      size: {
        sm: "text-[10px] px-1 py-0",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-2.5 py-0.5"
      }
    },
    defaultVariants: {
      edge: "low",
      size: "md"
    }
  }
);

export function getValueCategory(value: number): 'high' | 'medium' | 'low' | 'none' {
  if (value >= 8) return 'high';
  if (value >= 5) return 'medium';
  if (value > 0) return 'low';
  return 'none';
}

export function getEdgeCategory(edge: number): 'high' | 'medium' | 'low' | 'negative' {
  if (edge >= 10) return 'high';
  if (edge >= 5) return 'medium';
  if (edge >= 0) return 'low';
  return 'negative';
}

interface ValueBetIndicatorProps {
  valueBet?: ValueBet;
  showOdds?: boolean;
  showOutcome?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ValueBetIndicator({
  valueBet,
  showOdds = true,
  showOutcome = false,
  size = "md",
  className
}: ValueBetIndicatorProps) {
  if (!valueBet) return null;
  
  const { outcome, odds, value, edge, isRecommended } = valueBet;
  const valueCategory = getValueCategory(value);
  const edgeCategory = getEdgeCategory(edge);
  
  const tier = getTierFromString(valueBet.tier);
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-wrap gap-1 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span 
                className={cn(
                  valueBadgeVariants({ value: valueCategory, size }),
                  "cursor-help"
                )}
              >
                {isRecommended && <BadgeCheck className="h-3 w-3" />}
                <span>Value: {value > 0 ? `${value.toFixed(1)}` : 'None'}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs p-2 max-w-[200px]">
              <p className="font-bold">Bet Value: {value.toFixed(1)}</p>
              <p>Value represents the statistical advantage of this bet based on our predictions vs. bookmaker odds</p>
              {isRecommended && (
                <p className="mt-1 font-semibold text-green-500">
                  ✓ Recommended bet in {tier}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span 
                className={cn(
                  edgeVariants({ edge: edgeCategory, size }),
                  "cursor-help"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                <span>Edge: {edge > 0 ? `+${edge.toFixed(1)}%` : `${edge.toFixed(1)}%`}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs p-2 max-w-[200px]">
              <p className="font-bold">Betting Edge: {edge > 0 ? `+${edge.toFixed(1)}%` : `${edge.toFixed(1)}%`}</p>
              <p>Edge represents your percentage advantage over the bookmaker's implied probability</p>
              {edge >= 5 && (
                <p className="mt-1 font-semibold text-green-500">
                  Strong betting opportunity
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {(showOdds || showOutcome) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {showOutcome && (
            <span className="text-muted-foreground">
              Prediction: <span className="font-medium text-foreground">{outcome}</span>
            </span>
          )}
          
          {showOdds && (
            <span className="text-muted-foreground">
              Odds: <span className="font-medium text-foreground">{odds.toFixed(2)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}