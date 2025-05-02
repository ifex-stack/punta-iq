import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TierBadge, TierLevel, tierData } from './tier-badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LockIcon, UnlockIcon, CrownIcon, StarIcon, ShieldCheckIcon, ZapIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

// Define tier icons
const tierIcons: Record<TierLevel, React.ReactNode> = {
  'Tier 1': <CrownIcon className="h-5 w-5 text-purple-500" />,
  'Tier 2': <StarIcon className="h-5 w-5 text-blue-500" />,
  'Tier 5': <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />,
  'Tier 10': <ZapIcon className="h-5 w-5 text-amber-500" />
};

interface TierInfoCardProps {
  tier: TierLevel;
  className?: string;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function TierInfoCard({ 
  tier, 
  className,
  showUpgradeButton = true,
  compact = false
}: TierInfoCardProps) {
  const { user } = useAuth();
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  const isAccessible = !tierData[tier].isPremium || isPremiumUser;
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const data = tierData[tier];
  
  const handleUpgrade = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to access premium tiers",
        variant: "default"
      });
      navigate("/auth");
    } else {
      navigate("/subscription-page");
    }
  };
  
  const features = {
    'Tier 1': [
      'Highest confidence predictions',
      'Elite value bet opportunities',
      'Premium accumulator selections',
      'Detailed statistical explanations',
      'Enhanced edge detection'
    ],
    'Tier 2': [
      'High confidence predictions',
      'Strong value bet opportunities',
      'Premium accumulator selections',
      'Statistical explanations',
      'Solid edge detection'
    ],
    'Tier 5': [
      'Medium confidence predictions',
      'Moderate value opportunities',
      'Standard accumulator selections',
      'Basic statistical indicators'
    ],
    'Tier 10': [
      'Varied confidence predictions',
      'Basic value detection',
      'Free accumulator selections'
    ]
  };

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-center">
            <TierBadge tier={tier} size="lg" />
            <div className="text-muted-foreground">
              {isAccessible ? (
                <UnlockIcon className="h-4 w-4" />
              ) : (
                <LockIcon className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-sm text-muted-foreground">{data.description}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn(
        "p-4 pb-2",
        tier === 'Tier 1' && "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20",
        tier === 'Tier 2' && "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
        tier === 'Tier 5' && "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20",
        tier === 'Tier 10' && "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
      )}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {tierIcons[tier]}
            <TierBadge tier={tier} size="lg" />
          </div>
          <div className="text-muted-foreground">
            {isAccessible ? (
              <UnlockIcon className="h-4 w-4" />
            ) : (
              <LockIcon className="h-4 w-4" />
            )}
          </div>
        </div>
        <CardDescription>
          {data.description}
          {data.confidenceRange && ` • Confidence: ${data.confidenceRange}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <ul className="text-sm space-y-1">
          {features[tier].map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      {data.isPremium && !isPremiumUser && showUpgradeButton && (
        <CardFooter className="p-4 pt-2">
          <Button 
            onClick={handleUpgrade} 
            className="w-full"
            variant="default"
          >
            Upgrade to Access
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}