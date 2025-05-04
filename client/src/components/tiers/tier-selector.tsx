import React from 'react';
import { TierLevel, TierBadge } from './tier-badge';
import { cn } from '@/lib/utils';

interface TierSelectorProps {
  selectedTier: TierLevel | 'all';
  onTierChange: (tier: TierLevel | 'all') => void;
  className?: string;
  showAllOption?: boolean;
}

export function TierSelector({ 
  selectedTier = 'all', 
  onTierChange,
  className,
  showAllOption = true
}: TierSelectorProps) {
  
  // Available tiers
  const tiers: (TierLevel | 'all')[] = showAllOption 
    ? ['all', 'Tier 1', 'Tier 2', 'Tier 5', 'Tier 10'] 
    : ['Tier 1', 'Tier 2', 'Tier 5', 'Tier 10'];
  
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tiers.map(tier => (
        <button
          key={tier}
          onClick={() => onTierChange(tier)}
          className={cn(
            "transition-all",
            selectedTier === tier ? "ring-2 ring-primary ring-offset-1" : "hover:opacity-80"
          )}
        >
          {tier === 'all' ? (
            <div className="bg-muted text-foreground hover:bg-muted/80 py-0.5 px-2.5 text-sm font-semibold rounded-md">
              All Tiers
            </div>
          ) : (
            <TierBadge 
              tier={tier} 
              showTooltip={false}
            />
          )}
        </button>
      ))}
    </div>
  );
}