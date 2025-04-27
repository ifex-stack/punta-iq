import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Gift, Calendar, Trophy, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { CustomProgress } from "@/components/ui/custom-progress";
import { Badge } from "@/components/ui/badge";

interface ReferralStreakProps {
  className?: string;
}

// Streak rewards by streak count
const streakRewards = {
  3: { points: 750, description: "Three-peat bonus" },
  5: { points: 1500, description: "Five-streak bonus" },
  7: { points: 2500, description: "Weekly champion" },
  10: { points: 5000, description: "Decathlon streak" },
  15: { points: 10000, description: "Referral master" },
  30: { points: 25000, description: "Monthly maven" },
};

export const ReferralStreak: FC<ReferralStreakProps> = ({ className }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user info including streak data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/profile');
      return res.json();
    },
    onError: () => {
      toast({
        title: "Error fetching profile data",
        description: "Could not load your streak information",
        variant: "destructive",
      });
    }
  });
  
  // Find next milestone
  const findNextMilestone = (currentStreak: number) => {
    const milestones = Object.keys(streakRewards).map(Number).sort((a, b) => a - b);
    const nextMilestone = milestones.find(milestone => milestone > currentStreak);
    return nextMilestone || milestones[milestones.length - 1];
  };
  
  const currentStreak = userData?.referralStreak || 0;
  const nextMilestone = findNextMilestone(currentStreak);
  const nextReward = streakRewards[nextMilestone];
  
  // Calculate progress to next milestone
  const progress = nextMilestone ? Math.min(100, (currentStreak / nextMilestone) * 100) : 0;
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Referral Streak
        </CardTitle>
        <CardDescription>
          Keep your streak alive for bonus rewards
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold">{currentStreak}</span>
                  <span className="text-sm text-muted-foreground">consecutive referrals</span>
                </div>
              </div>
              
              <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-1">
                  <span>Progress to next reward</span>
                  {nextReward && (
                    <Badge variant="outline" className="ml-1 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                      +{nextReward.points} points
                    </Badge>
                  )}
                </span>
                <span className="text-muted-foreground">{currentStreak} / {nextMilestone}</span>
              </div>
              
              <CustomProgress 
                value={progress} 
                className="h-3"
                indicatorClassName="bg-gradient-to-r from-orange-500 to-amber-500"
              />
              
              <div className="text-xs text-center text-muted-foreground mt-1">
                {nextReward && (
                  <span>Next streak reward: <span className="font-medium text-orange-600 dark:text-orange-400">{nextReward.description}</span> at {nextMilestone} referrals</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border rounded-md p-3 flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Last Referral
                </span>
                <span className="font-medium">{formatDate(userData?.lastReferralDate)}</span>
              </div>
              
              <div className="border rounded-md p-3 flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  Streak Record
                </span>
                <span className="font-medium">{userData?.maxReferralStreak || currentStreak}</span>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-md p-3 text-sm mt-3">
              <h4 className="font-medium flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-primary" />
                Streak Tips
              </h4>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 min-w-[12px] text-primary" />
                  <span>Refer at least one friend every 30 days to maintain your streak</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 min-w-[12px] text-primary" />
                  <span>Longer streaks earn exponentially higher rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 min-w-[12px] text-primary" />
                  <span>Share on social media regularly to reach more potential referrals</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};