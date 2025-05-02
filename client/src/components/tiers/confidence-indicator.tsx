import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ConfidenceLevel = 'very high' | 'high' | 'medium' | 'low' | 'very low';

interface ConfidenceLevelData {
  label: string;
  color: string;
  range: string;
  description: string;
}

export const confidenceLevelData: Record<ConfidenceLevel, ConfidenceLevelData> = {
  'very high': {
    label: 'Very High',
    color: 'indigo',
    range: '85-100%',
    description: 'Highest confidence predictions based on strong statistical indicators and historical performance patterns'
  },
  'high': {
    label: 'High',
    color: 'blue',
    range: '70-84%',
    description: 'Strong confidence predictions with substantial statistical backing'
  },
  'medium': {
    label: 'Medium',
    color: 'emerald',
    range: '55-69%',
    description: 'Moderate confidence predictions with balanced risk factors'
  },
  'low': {
    label: 'Low',
    color: 'amber',
    range: '40-54%',
    description: 'Lower confidence predictions with more variables affecting outcomes'
  },
  'very low': {
    label: 'Very Low',
    color: 'orange',
    range: '0-39%',
    description: 'Lowest confidence predictions with significant uncertainty factors'
  }
};

const confidenceBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      level: {
        'very high': "bg-indigo-100 text-indigo-800 dark:bg-indigo-800/20 dark:text-indigo-300",
        'high': "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300",
        'medium': "bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-300",
        'low': "bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-300",
        'very low': "bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-300"
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1"
      }
    },
    defaultVariants: {
      level: "medium",
      size: "md"
    }
  }
);

const progressVariants = cva(
  "h-2 w-full",
  {
    variants: {
      level: {
        'very high': "bg-indigo-200 dark:bg-indigo-950",
        'high': "bg-blue-200 dark:bg-blue-950",
        'medium': "bg-emerald-200 dark:bg-emerald-950",
        'low': "bg-amber-200 dark:bg-amber-950",
        'very low': "bg-orange-200 dark:bg-orange-950"
      }
    },
    defaultVariants: {
      level: "medium"
    }
  }
);

const progressIndicatorVariants = cva(
  "",
  {
    variants: {
      level: {
        'very high': "bg-indigo-600 dark:bg-indigo-400",
        'high': "bg-blue-600 dark:bg-blue-400",
        'medium': "bg-emerald-600 dark:bg-emerald-400",
        'low': "bg-amber-600 dark:bg-amber-400",
        'very low': "bg-orange-600 dark:bg-orange-400"
      }
    },
    defaultVariants: {
      level: "medium"
    }
  }
);

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 85) return 'very high';
  if (confidence >= 70) return 'high';
  if (confidence >= 55) return 'medium';
  if (confidence >= 40) return 'low';
  return 'very low';
}

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ConfidenceBadge({ level, size = "md", className }: ConfidenceBadgeProps) {
  return (
    <span 
      className={cn(
        confidenceBadgeVariants({ level, size }),
        className
      )}
    >
      {confidenceLevelData[level].label}
    </span>
  );
}

interface ConfidenceIndicatorProps {
  confidence: number;
  showExplanation?: boolean;
  explanation?: string;
  className?: string;
  showPercentage?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceIndicator({
  confidence,
  showExplanation = false,
  explanation,
  className,
  showPercentage = true,
  showLabel = true,
  size = "md"
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(confidence);
  const data = confidenceLevelData[level];

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <ConfidenceBadge level={level} size={size} />
          {showPercentage && (
            <span className="text-xs font-medium">
              {confidence}%
            </span>
          )}
        </div>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <Progress
                value={confidence}
                max={100}
                className={cn(
                  progressVariants({ level }),
                  "rounded-full"
                )}
                indicatorClassName={progressIndicatorVariants({ level })}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs p-2 max-w-[200px]">
            <p className="font-bold">{data.label} Confidence ({data.range})</p>
            <p>{data.description}</p>
            {showExplanation && explanation && (
              <p className="mt-1 italic">{explanation}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showExplanation && explanation && (
        <p className="text-xs text-muted-foreground mt-1 italic">
          {explanation.length > 100 ? `${explanation.substring(0, 100)}...` : explanation}
        </p>
      )}
    </div>
  );
}