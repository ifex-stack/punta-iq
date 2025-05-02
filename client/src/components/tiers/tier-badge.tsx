import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LockIcon, UnlockIcon } from 'lucide-react';

// Define tier types and their properties
export type TierLevel = 'Tier 1' | 'Tier 2' | 'Tier 5' | 'Tier 10';

export interface TierData {
  name: TierLevel;
  description: string;
  isPremium: boolean;
  color: string;
  confidenceRange?: string;
}

// Tier badge variants
const tierBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      tier: {
        "Tier 1": "bg-gradient-to-r from-purple-600 to-indigo-700 text-white border border-indigo-500 shadow-lg",
        "Tier 2": "bg-gradient-to-r from-blue-600 to-cyan-700 text-white border border-blue-500 shadow-md",
        "Tier 5": "bg-gradient-to-r from-emerald-600 to-green-700 text-white border border-emerald-500",
        "Tier 10": "bg-gradient-to-r from-amber-500 to-orange-600 text-white border border-amber-500"
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1"
      },
    },
    defaultVariants: {
      tier: "Tier 10",
      size: "md",
    },
  }
);

export interface TierBadgeProps {
  tier: TierLevel;
  showLock?: boolean;
  isAccessible?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TierBadge({ 
  tier, 
  showLock = false, 
  isAccessible = true, 
  size = "md",
  className 
}: TierBadgeProps) {
  return (
    <Badge 
      className={cn(
        tierBadgeVariants({ tier, size }), 
        className,
        showLock && !isAccessible && "opacity-80"
      )}
    >
      {tier}
      {showLock && (
        <span className="ml-1">
          {isAccessible ? (
            <UnlockIcon className="h-3 w-3" />
          ) : (
            <LockIcon className="h-3 w-3" />
          )}
        </span>
      )}
    </Badge>
  );
}

export const tierData: Record<TierLevel, TierData> = {
  "Tier 1": {
    name: "Tier 1",
    description: "Premium selections with highest confidence and value",
    isPremium: true,
    color: "indigo",
    confidenceRange: "90-100%"
  },
  "Tier 2": {
    name: "Tier 2",
    description: "High confidence selections with strong value",
    isPremium: true,
    color: "blue",
    confidenceRange: "80-90%"
  },
  "Tier 5": {
    name: "Tier 5",
    description: "Solid selections with reasonable value",
    isPremium: false,
    color: "emerald",
    confidenceRange: "65-80%"
  },
  "Tier 10": {
    name: "Tier 10",
    description: "Standard selections with varied confidence",
    isPremium: false,
    color: "amber",
    confidenceRange: "50-65%"
  }
};

export function getTierFromString(tierString?: string): TierLevel {
  if (!tierString) return "Tier 10";
  
  switch (tierString) {
    case "Tier 1":
      return "Tier 1";
    case "Tier 2":
      return "Tier 2";
    case "Tier 5":
      return "Tier 5";
    default:
      return "Tier 10";
  }
}