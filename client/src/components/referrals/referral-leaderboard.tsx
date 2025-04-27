import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Medal, Gift, Star, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface ReferralLeaderboardProps {
  limit?: number;
}

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalReferrals: number;
  completedReferrals: number;
  tier: string;
  rank: number;
}

export const ReferralLeaderboard: FC<ReferralLeaderboardProps> = ({ limit = 10 }) => {
  const { user } = useAuth();
  
  // Fetch referral leaderboard
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/referrals/leaderboard'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/referrals/leaderboard');
      return res.json();
    }
  });
  
  // Get icon by rank
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 text-primary" />;
    }
  };
  
  // Get tier badge color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-700 text-white';
      case 'silver':
        return 'bg-gray-400 text-white';
      case 'gold':
        return 'bg-yellow-400 text-black';
      case 'platinum':
        return 'bg-blue-300 text-black';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Referral Champions
        </CardTitle>
        <CardDescription>
          Our top referrers this month
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="divide-y">
            {leaderboard.slice(0, limit).map((entry: LeaderboardEntry) => (
              <div 
                key={entry.userId} 
                className={`flex items-center justify-between p-4 ${
                  user?.id === entry.userId ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {entry.rank <= 3 ? (
                        getRankIcon(entry.rank)
                      ) : (
                        <Users className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border">
                      {entry.rank}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">
                        {entry.username}
                      </h3>
                      {user?.id === entry.userId && (
                        <Badge variant="outline" className="text-xs py-0 px-1 h-4">You</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className={`text-xs py-0 px-1 h-4 ${getTierColor(entry.tier)} capitalize`}>
                        {entry.tier}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold">{entry.completedReferrals}</div>
                  <div className="text-xs text-muted-foreground">Referrals</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Gift className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium">No Referrals Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to refer friends and top the leaderboard!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};