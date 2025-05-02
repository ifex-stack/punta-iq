import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TierBadge, TierLevel, tierData } from './tier-badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LockIcon } from 'lucide-react';

interface TierSelectorProps {
  selectedTier: TierLevel | 'all';
  onTierChange: (tier: TierLevel | 'all') => void;
  className?: string;
  showAll?: boolean;
}

export function TierSelector({ 
  selectedTier, 
  onTierChange, 
  className,
  showAll = true
}: TierSelectorProps) {
  const { user } = useAuth();
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  
  // All available tiers
  const tiers: TierLevel[] = ['Tier 1', 'Tier 2', 'Tier 5', 'Tier 10'];
  
  // Determine if a tier is accessible based on premium status
  const isAccessible = (tier: TierLevel) => {
    const isPremiumTier = tierData[tier].isPremium;
    return !isPremiumTier || isPremiumUser;
  };

  return (
    <Tabs
      value={selectedTier}
      onValueChange={(value) => onTierChange(value as TierLevel | 'all')}
      className={cn("w-full", className)}
    >
      <TabsList className="grid grid-cols-5 h-auto p-1">
        {showAll && (
          <TabsTrigger 
            value="all"
            className={cn(
              "text-xs py-1.5 px-2 font-medium",
              selectedTier === 'all' ? "bg-primary text-primary-foreground" : ""
            )}
          >
            All
          </TabsTrigger>
        )}
        
        {tiers.map((tier) => {
          const accessible = isAccessible(tier);
          
          return (
            <TooltipProvider key={tier}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value={tier}
                    className={cn(
                      "text-xs py-1 px-2 font-medium relative",
                      !accessible && "opacity-60"
                    )}
                    disabled={!accessible}
                  >
                    <TierBadge tier={tier} size="sm" />
                    {!accessible && (
                      <LockIcon className="absolute top-0 right-0 h-2.5 w-2.5 -mt-1 -mr-1 text-gray-100" />
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs p-2 max-w-[200px]">
                  <p className="font-bold">{tier}</p>
                  <p>{tierData[tier].description}</p>
                  {tierData[tier].isPremium && !isPremiumUser && (
                    <p className="mt-1 text-amber-400 font-semibold">
                      Requires Pro or Elite subscription
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </TabsList>
    </Tabs>
  );
}