import React from 'react';
import { TierLevel, TierBadge, getTierFromString } from './tier-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp, PercentIcon, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Tier data object with descriptions for each tier
const tierData = {
  'Tier 1': {
    name: 'Tier 1 - Top Tier',
    shortDescription: 'Highest confidence premium predictions with significant edge',
    description: 'Highest confidence predictions with superior value edge, extensive model validation, and in-depth statistical analysis. Limited to Pro and Elite subscribers.',
    features: [
      '90-95% Confidence Score',
      '10-15% Value Edge',
      'Extensive Model Validation',
      'Premium Pre-match Analysis',
    ],
    accessLevel: 'pro',
    badgeText: 'Pro+',
    color: 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20'
  },
  'Tier 2': {
    name: 'Tier 2 - Pro Grade',
    shortDescription: 'High confidence selections with positive expected value',
    description: 'Strong confidence predictions with solid value edge and robust statistical backing. Available exclusively to Pro and Elite subscribers.',
    features: [
      '80-89% Confidence Score',
      '7-9% Value Edge',
      'Strong Statistical Backing',
      'Premium Match Insights'
    ],
    accessLevel: 'pro',
    badgeText: 'Pro+',
    color: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
  },
  'Tier 5': {
    name: 'Tier 5 - Quality Picks',
    shortDescription: 'Medium confidence predictions with decent statistical edge',
    description: 'Solid predictions with reasonable confidence levels and statistical support. Available to all subscribers, including free users.',
    features: [
      '70-79% Confidence Score',
      '4-6% Value Edge',
      'Reliable Pattern Analysis',
      'Regular Match Insights'
    ],
    accessLevel: 'free',
    badgeText: 'Free',
    color: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20'
  },
  'Tier 10': {
    name: 'Tier 10 - Value Bets',
    shortDescription: 'Higher-risk picks with potential for enhanced returns',
    description: 'Value-based selections that may carry higher risk but offer potential for greater returns. Available to all users at no cost.',
    features: [
      '55-69% Confidence Score',
      '2-3% Value Edge',
      'Basic Data Analysis',
      'Standard Match Insights'
    ],
    accessLevel: 'free',
    badgeText: 'Free',
    color: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
  }
};

interface TierInfoCardProps {
  tier: TierLevel;
  compact?: boolean;
  className?: string;
}

export function TierInfoCard({ 
  tier, 
  compact = false,
  className 
}: TierInfoCardProps) {
  const { user } = useAuth();
  
  // Parse the tier level
  const tierLevel = getTierFromString(tier);
  
  // Get tier data
  const data = tierData[tierLevel];
  
  // Check if user has access to this tier
  const requiresPro = data.accessLevel === 'pro';
  const hasAccess = !requiresPro || (user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier));
  
  // Compact version for grid displays
  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className={cn("p-4", data.color)}>
          <div className="flex justify-between items-start mb-2">
            <TierBadge tier={tierLevel} size="md" />
            <Badge variant={requiresPro ? "default" : "secondary"}>
              {data.badgeText}
            </Badge>
          </div>
          <CardTitle className="text-base font-bold mb-1">{tierLevel}</CardTitle>
          <CardDescription className="line-clamp-2">
            {data.shortDescription}
          </CardDescription>
        </div>
        <CardContent className="p-3 pt-3">
          <div className="flex items-center gap-2 text-sm mb-2">
            <PercentIcon className="h-4 w-4 text-primary" />
            <span>{data.features[0]}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>{data.features[1]}</span>
          </div>
          {!hasAccess && requiresPro && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1"
                onClick={() => window.location.href = "/subscription-page"}
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Unlock
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Full detailed version
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className={cn("px-5 py-4", data.color)}>
        <div className="flex justify-between items-start mb-2">
          <TierBadge tier={tierLevel} size="lg" />
          <Badge variant={requiresPro ? "default" : "secondary"}>
            {data.badgeText}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold mb-1">{tierLevel}</CardTitle>
        <CardDescription className="text-base">
          {data.shortDescription}
        </CardDescription>
      </div>
      <CardContent className="p-5">
        <p className="text-muted-foreground mb-4">
          {data.description}
        </p>
        
        <div className="space-y-3 mb-4">
          {data.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              {index === 0 ? (
                <PercentIcon className="h-4 w-4 text-primary" />
              ) : index === 1 ? (
                <DollarSign className="h-4 w-4 text-primary" />
              ) : index === 2 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
                  i
                </div>
              )}
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        {!hasAccess && requiresPro && (
          <Button
            className="w-full"
            onClick={() => window.location.href = "/subscription-page"}
          >
            <Lock className="h-4 w-4 mr-2" />
            Upgrade to Access
          </Button>
        )}
      </CardContent>
    </Card>
  );
}