import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { Info, BarChart3, MoveUp, MoveDown, RefreshCw } from 'lucide-react';

// Confidence levels
export type ConfidenceLevel = 'very-high' | 'high' | 'medium' | 'low';

interface ConfidenceIndicatorProps {
  confidence: number;
  explanation?: string;
  showExplanation?: boolean;
  showDetailed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Get confidence level based on percentage
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 85) return 'very-high';
  if (confidence >= 70) return 'high';
  if (confidence >= 55) return 'medium';
  return 'low';
}

// Get text description based on confidence level
function getConfidenceLevelText(level: ConfidenceLevel): string {
  switch (level) {
    case 'very-high': return 'Very High';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return '';
  }
}

// Get color styles based on confidence level
function getConfidenceColor(level: ConfidenceLevel): {
  text: string;
  bar: string;
  bg: string;
} {
  switch (level) {
    case 'very-high':
      return {
        text: 'text-emerald-700 dark:text-emerald-400',
        bar: 'bg-emerald-500 dark:bg-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20'
      };
    case 'high':
      return {
        text: 'text-blue-700 dark:text-blue-400',
        bar: 'bg-blue-500 dark:bg-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/20'
      };
    case 'medium':
      return {
        text: 'text-amber-700 dark:text-amber-400',
        bar: 'bg-amber-500 dark:bg-amber-500', 
        bg: 'bg-amber-50 dark:bg-amber-950/20'
      };
    case 'low':
      return {
        text: 'text-red-700 dark:text-red-400',
        bar: 'bg-red-500 dark:bg-red-500',
        bg: 'bg-red-50 dark:bg-red-950/20'
      };
    default:
      return {
        text: 'text-muted-foreground',
        bar: 'bg-muted-foreground',
        bg: 'bg-muted/20'
      };
  }
}

// Get indicator text based on confidence
function getIndicatorText(confidence: number, level: ConfidenceLevel): string {
  switch (level) {
    case 'very-high':
      return 'Excellent chance of success';
    case 'high':
      return 'Good probability of winning';
    case 'medium':
      return 'Reasonable chance of success';
    case 'low':
      return 'Uncertain outcome, proceed with caution';
    default:
      return '';
  }
}

// Display a minimal progress bar with confidence
function ConfidenceProgressBar({ 
  value, 
  max = 100,
  className,
  indicatorClassName
}: { 
  value: number; 
  max?: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="h-2 w-full bg-muted relative rounded-full overflow-hidden">
        <div 
          className={cn("h-full absolute left-0 top-0 rounded-full", indicatorClassName)}
          style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }}
        />
      </div>
    </div>
  );
}

// Main component
export function ConfidenceIndicator({ 
  confidence, 
  explanation,
  showExplanation = true,
  showDetailed = false,
  size = 'md',
  className
}: ConfidenceIndicatorProps) {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  
  // Get confidence level
  const confidenceLevel = getConfidenceLevel(confidence);
  
  // Get styles based on confidence level
  const colors = getConfidenceColor(confidenceLevel);
  
  // Determine sizes based on the size prop
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // More compact or expanded display based on size
  if (size === 'sm' || !showDetailed) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={cn(textSizes[size], "font-medium")}>Confidence</span>
          </div>
          
          <div className="flex items-center">
            <span className={cn(textSizes[size], "font-bold", colors.text)}>
              {confidence}%
            </span>
            
            {explanation && showExplanation && (
              <Popover open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 ml-1"
                  >
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-80 p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Confidence Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      {explanation}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        
        <ConfidenceProgressBar 
          value={confidence} 
          max={100} 
          className="mb-1"
          indicatorClassName={colors.bar}
        />
        
        <div className="text-xs text-muted-foreground">
          {getIndicatorText(confidence, confidenceLevel)}
        </div>
      </div>
    );
  }
  
  // More detailed display for larger sizes
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">AI Confidence Score</span>
        </div>
        
        <div className="flex items-center">
          <span className={cn("font-bold text-lg", colors.text)}>
            {confidence}%
          </span>
          <span className={cn("ml-2 text-sm font-medium", colors.text)}>
            {getConfidenceLevelText(confidenceLevel)}
          </span>
          
          {explanation && showExplanation && (
            <Popover open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 ml-1"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Confidence Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    {explanation}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      
      <div className={cn("p-3 rounded-md mb-2", colors.bg)}>
        <ConfidenceProgressBar 
          value={confidence} 
          max={100} 
          className="mb-2"
          indicatorClassName={colors.bar}
        />
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1.5">
            {confidenceLevel === 'very-high' || confidenceLevel === 'high' ? (
              <MoveUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <MoveDown className="h-4 w-4 text-amber-500" />
            )}
            <span>{getIndicatorText(confidence, confidenceLevel)}</span>
          </div>
          
          <div className="flex items-center">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">Updated today</span>
          </div>
        </div>
      </div>
    </div>
  );
}