import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Trophy, Medal, Award, Users, ArrowUpRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cva } from "class-variance-authority";
import { ReferralBadge } from "./referral-badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface ReferralLeaderboardProps {
  limit?: number;
  className?: string;
}

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalReferrals: number;
  completedReferrals: number;
  currentStreak: number;
  tier: TierType;
  rank: number;
}

type TierType = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

// Define tier badge styles
const tierBadgeVariants = cva("h-6 w-6 flex items-center justify-center rounded-full", {
  variants: {
    tier: {
      none: "bg-gray-200 text-gray-500",
      bronze: "bg-amber-700/20 text-amber-700",
      silver: "bg-gray-300/30 text-gray-500",
      gold: "bg-yellow-400/20 text-yellow-400",
      platinum: "bg-blue-300/20 text-blue-300"
    }
  },
  defaultVariants: {
    tier: "none"
  }
});

export const ReferralLeaderboard: FC<ReferralLeaderboardProps> = ({ limit = 10, className }) => {
  const { user } = useAuth();
  
  // Fetch leaderboard data
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/referrals/leaderboard'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/referrals/leaderboard?limit=${limit}`);
      return res.json();
    }
  });
  
  // Get tier icon based on tier
  const getTierIcon = (tier: TierType) => {
    switch (tier) {
      case 'platinum':
        return <Award className="h-4 w-4" />;
      case 'gold':
        return <Trophy className="h-4 w-4" />;
      case 'silver':
      case 'bronze':
        return <Medal className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };
  
  // Get user's position in leaderboard
  const getUserPosition = () => {
    if (!leaderboard || !user) return null;
    
    return leaderboard.find(entry => entry.userId === user.id);
  };
  
  const userPosition = getUserPosition();
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Referral Leaderboard
        </CardTitle>
        <CardDescription>
          Top referrers this month
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* User's position if in leaderboard */}
            {userPosition && (
              <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {userPosition.rank}
                  </div>
                  <div>
                    <div className="font-medium flex items-center">
                      {user?.username}
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>
                    </div>
                    <ReferralBadge minimal />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold flex items-center gap-1">
                    {userPosition.completedReferrals}
                    {userPosition.currentStreak > 0 && (
                      <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full flex items-center">
                        <Flame className="h-3 w-3 mr-0.5" />
                        {userPosition.currentStreak}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Referrals</div>
                </div>
              </div>
            )}
            
            {/* Top positions */}
            <div className="space-y-1">
              {leaderboard?.slice(0, limit).map((entry) => (
                <div 
                  key={entry.userId}
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md",
                    entry.userId === user?.id ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Rank indicator */}
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
                      entry.rank === 1 ? "bg-yellow-400/20 text-yellow-500" :
                      entry.rank === 2 ? "bg-gray-300/30 text-gray-600" :
                      entry.rank === 3 ? "bg-amber-700/20 text-amber-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {entry.rank}
                    </div>
                    
                    {/* User info */}
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {entry.username}
                        {entry.userId === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <span className={tierBadgeVariants({ tier: entry.tier })}>
                          {getTierIcon(entry.tier)}
                        </span>
                        <span className="capitalize">{entry.tier} Tier</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Referral count */}
                  <div className="text-right">
                    <div className="font-semibold flex items-center gap-1">
                      {entry.completedReferrals}
                      {entry.currentStreak > 0 && (
                        <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full flex items-center">
                          <Flame className="h-3 w-3 mr-0.5" />
                          {entry.currentStreak}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Referrals</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View all button */}
            {(leaderboard?.length || 0) > 5 && (
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                View Full Leaderboard
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};