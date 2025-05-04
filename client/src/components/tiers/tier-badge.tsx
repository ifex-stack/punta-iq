import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { 
  Trophy,
  Award,
  Medal,
  Star 
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define tier levels
export type TierLevel = 'Tier 1' | 'Tier 2' | 'Tier 5' | 'Tier 10';

// Tier badge props
interface TierBadgeProps {
  tier: TierLevel;
  className?: string;
  showLock?: boolean;
  isAccessible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

// Helper function to convert string to TierLevel
export function getTierFromString(tierString: string): TierLevel {
  // Extract just the number from the tier string (e.g., "Tier 1" -> 1)
  const tierNumber = parseInt(tierString.replace(/[^0-9]/g, ''));
  
  if (tierNumber === 1) return 'Tier 1';
  if (tierNumber === 2) return 'Tier 2';
  if (tierNumber === 5) return 'Tier 5';
  
  // Default to Tier 10 for any other numbers
  return 'Tier 10';
}

// Get description based on tier
function getTierDescription(tier: TierLevel): string {
  switch (tier) {
    case 'Tier 1':
      return 'Highest confidence predictions with significant value edge (Pro+ required)';
    case 'Tier 2':
      return 'Strong confidence selections with positive expected value (Pro+ required)';
    case 'Tier 5':
      return 'Medium confidence predictions with decent statistical edge';
    case 'Tier 10':
      return 'Value-based selections with potential for high returns';
    default:
      return '';
  }
}

// Get tier icon component based on tier
function getTierIcon(tier: TierLevel, size: 'sm' | 'md' | 'lg' = 'md'): React.ReactNode {
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  switch (tier) {
    case 'Tier 1':
      return <Trophy className={cn(iconSizes[size], "text-purple-500 dark:text-purple-400")} />;
    case 'Tier 2':
      return <Award className={cn(iconSizes[size], "text-blue-500 dark:text-blue-400")} />;
    case 'Tier 5':
      return <Medal className={cn(iconSizes[size], "text-emerald-500 dark:text-emerald-400")} />;
    case 'Tier 10':
      return <Star className={cn(iconSizes[size], "text-amber-500 dark:text-amber-400")} />;
    default:
      return null;
  }
}

// Main component
export function TierBadge({ 
  tier, 
  className,
  showLock = false,
  isAccessible = true,
  size = 'md',
  showTooltip = true
}: TierBadgeProps) {
  // Determine badge styles based on tier
  const badgeStyles = {
    'Tier 1': 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900/60',
    'Tier 2': 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60',
    'Tier 5': 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
    'Tier 10': 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60'
  };
  
  // Determine text and icon size based on badge size
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // Determine padding based on size
  const paddings = {
    sm: 'py-0 px-2',
    md: 'py-0.5 px-2.5',
    lg: 'py-1 px-3'
  };
  
  // Create the badge element
  const badgeElement = (
    <Badge 
      variant="outline"
      className={cn(
        badgeStyles[tier],
        textSizes[size],
        paddings[size],
        "font-semibold border flex items-center gap-1",
        !isAccessible && "opacity-80",
        className
      )}
    >
      {getTierIcon(tier, size)}
      <span>{tier}</span>
      {showLock && !isAccessible && (
        <Lock className={cn(
          size === 'sm' ? "h-2.5 w-2.5" : size === 'md' ? "h-3.5 w-3.5" : "h-4 w-4",
          "ml-0.5" 
        )} />
      )}
    </Badge>
  );
  
  // If tooltip is not needed, just return the badge
  if (!showTooltip) {
    return badgeElement;
  }
  
  // Return with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeElement}
        </TooltipTrigger>
        <TooltipContent className="max-w-sm" side="bottom">
          <div className="space-y-1">
            <p className="font-semibold flex items-center">
              {getTierIcon(tier, 'md')}
              <span className="ml-1">{tier}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {getTierDescription(tier)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}