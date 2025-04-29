import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BadgeCheckIcon, TrophyIcon, StarIcon, HeartIcon, ZapIcon, ClockIcon, TargetIcon, TrendingUpIcon, AwardIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Badge interface
export interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  progress: number;
  target: number;
  earnedAt: Date | null;
  isNew: boolean;
}

// Function to get icon based on badge category
const getBadgeIcon = (category: string, className: string = "h-6 w-6") => {
  switch (category.toLowerCase()) {
    case 'prediction':
      return <TargetIcon className={className} />;
    case 'streak':
      return <TrendingUpIcon className={className} />;
    case 'activity':
      return <ClockIcon className={className} />;
    case 'special':
      return <AwardIcon className={className} />;
    case 'achievement':
      return <TrophyIcon className={className} />;
    case 'social':
      return <HeartIcon className={className} />;
    case 'power':
      return <ZapIcon className={className} />;
    case 'loyalty':
      return <StarIcon className={className} />;
    default:
      return <BadgeCheckIcon className={className} />;
  }
};

// Function to get color based on badge tier
const getBadgeColor = (tier: string) => {
  switch (tier.toLowerCase()) {
    case 'bronze':
      return 'bg-amber-700';
    case 'silver':
      return 'bg-slate-400';
    case 'gold':
      return 'bg-amber-400';
    case 'platinum':
      return 'bg-slate-300';
    case 'diamond':
      return 'bg-sky-400';
    default:
      return 'bg-slate-600';
  }
};

const BadgeCard = ({ badge }: { badge: UserBadge }) => {
  const isEarned = badge.earnedAt !== null;
  const progressPercentage = Math.min(100, Math.round((badge.progress / badge.target) * 100));
  
  return (
    <Card className={`overflow-hidden transition-all ${isEarned ? 'border-primary' : 'border-muted'} ${badge.isNew ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className={`py-4 ${isEarned ? getBadgeColor(badge.tier) : 'bg-muted'}`}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-white">{badge.name}</CardTitle>
          <div className={`rounded-full p-1 ${isEarned ? 'bg-white' : 'bg-muted-foreground/20'}`}>
            {getBadgeIcon(badge.category, "h-5 w-5")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardDescription className="text-xs mb-3 min-h-[40px]">{badge.description}</CardDescription>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span className="font-semibold">{badge.progress}/{badge.target}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {badge.isNew && isEarned && (
            <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
              New!
            </Badge>
          )}
        </div>
      </CardContent>
      {isEarned && (
        <CardFooter className="p-3 bg-muted/30 text-xs text-muted-foreground border-t">
          <div className="flex items-center space-x-1">
            <BadgeCheckIcon className="h-3 w-3" />
            <span>Earned {new Date(badge.earnedAt!).toLocaleDateString()}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export function BadgesGrid() {
  const { toast } = useToast();
  
  // Define as any to temporarily fix type issues 
  const { data: badges, isLoading, isError } = useQuery({
    queryKey: ['/api/user/badges'],
    retry: 2
  }) as { data: UserBadge[] | undefined, isLoading: boolean, isError: boolean };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Achievements & Badges</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-muted h-14"></CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !badges) {
    return (
      <div className="text-center p-8 border rounded-lg bg-card">
        <BadgeCheckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Could not load badges</h3>
        <p className="text-muted-foreground mb-4">
          We're having trouble loading your achievement badges right now.
        </p>
      </div>
    );
  }

  // Sort badges: earned first (newest to oldest), then unearned by progress percentage
  const sortedBadges = [...badges].sort((a, b) => {
    // First sort by earned status
    if (!!a.earnedAt !== !!b.earnedAt) {
      return a.earnedAt ? -1 : 1;
    }
    
    // If both are earned, sort by earnedAt date (newest first)
    if (a.earnedAt && b.earnedAt) {
      return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
    }
    
    // If neither is earned, sort by progress percentage
    const aProgress = a.progress / a.target;
    const bProgress = b.progress / b.target;
    return bProgress - aProgress;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Achievements & Badges</h2>
        <div className="text-sm text-muted-foreground">
          {badges.filter(b => b.earnedAt).length}/{badges.length} Unlocked
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}

export default BadgesGrid;