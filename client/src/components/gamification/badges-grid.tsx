import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Award, Medal, Star, Trophy, Target, Flame, Activity } from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  achieved: boolean;
  progress?: number;
  maxProgress?: number;
  achievedDate?: Date;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface BadgesGridProps {
  badges: Badge[];
  isLoading?: boolean;
  filterCategory?: string;
}

// Helper function to render the appropriate icon
const renderBadgeIcon = (iconName: string, tier: string) => {
  const tierColors = {
    bronze: 'text-amber-600',
    silver: 'text-slate-400',
    gold: 'text-yellow-400',
    platinum: 'text-cyan-400'
  };
  
  const colorClass = tierColors[tier as keyof typeof tierColors] || 'text-muted-foreground';
  const sizeClass = 'h-8 w-8';
  
  switch (iconName) {
    case 'shield':
      return <Shield className={`${sizeClass} ${colorClass}`} />;
    case 'award':
      return <Award className={`${sizeClass} ${colorClass}`} />;
    case 'medal':
      return <Medal className={`${sizeClass} ${colorClass}`} />;
    case 'star':
      return <Star className={`${sizeClass} ${colorClass}`} />;
    case 'trophy':
      return <Trophy className={`${sizeClass} ${colorClass}`} />;
    case 'target':
      return <Target className={`${sizeClass} ${colorClass}`} />;
    case 'flame':
      return <Flame className={`${sizeClass} ${colorClass}`} />;
    default:
      return <Activity className={`${sizeClass} ${colorClass}`} />;
  }
};

export function BadgesGrid({ badges, isLoading = false, filterCategory }: BadgesGridProps) {
  // Filter badges by category if a filter is provided
  const filteredBadges = filterCategory 
    ? badges.filter(badge => badge.category === filterCategory)
    : badges;
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="p-4">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-muted"></div>
              </div>
              <div className="h-4 bg-muted rounded-md w-4/5 mx-auto"></div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-3 bg-muted rounded-md w-full mt-2"></div>
              <div className="h-3 bg-muted rounded-md w-4/5 mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Show empty state
  if (!filteredBadges.length) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-1">No Badges Found</h3>
        <p className="text-sm text-muted-foreground">
          {filterCategory 
            ? `No ${filterCategory} badges are available yet.` 
            : "You haven't earned any badges yet. Keep playing to earn achievements!"}
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {filteredBadges.map((badge) => (
        <TooltipProvider key={badge.id} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={`transition-all ${badge.achieved ? 'bg-background' : 'bg-muted/30 opacity-70'}`}>
                <CardHeader className="p-4 pb-2 text-center">
                  <div className="flex justify-center mb-2">
                    {renderBadgeIcon(badge.icon, badge.tier)}
                  </div>
                  <CardTitle className="text-sm font-semibold">{badge.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {badge.category} • {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {badge.achieved ? (
                    <p className="text-xs text-center text-muted-foreground">
                      Achieved{' '}
                      {badge.achievedDate && (
                        <span>on {new Date(badge.achievedDate).toLocaleDateString()}</span>
                      )}
                    </p>
                  ) : badge.progress !== undefined && badge.maxProgress ? (
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all" 
                        style={{ 
                          width: `${Math.min(100, (badge.progress / badge.maxProgress) * 100)}%` 
                        }}
                      ></div>
                      <p className="text-xs text-center mt-1 text-muted-foreground">
                        {badge.progress} / {badge.maxProgress}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-center mt-2 text-muted-foreground">Not yet achieved</p>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <p className="font-medium mb-1">{badge.name}</p>
              <p className="text-xs">{badge.description}</p>
              {!badge.achieved && badge.progress !== undefined && (
                <p className="text-xs mt-1 font-medium">
                  Progress: {badge.progress} / {badge.maxProgress}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}