import { FC, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Gift, Calendar, Trophy, ArrowRight, Clock, BadgeCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { CustomProgress } from "@/components/ui/custom-progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ReferralStreakProps {
  className?: string;
}

// Streak rewards by streak count
const streakRewards: Record<number, { points: number; description: string }> = {
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
      try {
        const res = await apiRequest('GET', '/api/user/profile');
        return res.json();
      } catch (error) {
        toast({
          title: "Error fetching profile data",
          description: "Could not load your streak information",
          variant: "destructive",
        });
        throw error;
      }
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
  
  // Calculate remaining days until streak expires
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [streakStatus, setStreakStatus] = useState<'healthy' | 'warning' | 'danger' | 'expired'>('healthy');
  
  useEffect(() => {
    if (!userData?.lastReferralDate) {
      setDaysRemaining(null);
      return;
    }
    
    const lastReferralDate = new Date(userData.lastReferralDate);
    const expiryDate = new Date(lastReferralDate);
    expiryDate.setDate(expiryDate.getDate() + 30); // Streak expires after 30 days
    
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDaysRemaining(diffDays > 0 ? diffDays : 0);
    
    // Set status based on remaining days
    if (diffDays <= 0) {
      setStreakStatus('expired');
    } else if (diffDays <= 3) {
      setStreakStatus('danger');
    } else if (diffDays <= 7) {
      setStreakStatus('warning');
    } else {
      setStreakStatus('healthy');
    }
  }, [userData?.lastReferralDate]);
  
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
            
            {/* Streak Countdown */}
            {daysRemaining !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`mt-3 border rounded-md p-3 flex items-center justify-between ${
                      streakStatus === 'expired' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      streakStatus === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 
                      streakStatus === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 
                      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          streakStatus === 'expired' ? 'bg-red-100 dark:bg-red-800' :
                          streakStatus === 'danger' ? 'bg-red-100 dark:bg-red-800' : 
                          streakStatus === 'warning' ? 'bg-amber-100 dark:bg-amber-800' : 
                          'bg-green-100 dark:bg-green-800'
                        }`}>
                          <Clock className={`h-5 w-5 ${
                            streakStatus === 'expired' ? 'text-red-600 dark:text-red-400' :
                            streakStatus === 'danger' ? 'text-red-600 dark:text-red-400' : 
                            streakStatus === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
                            'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Streak Status</p>
                          <p className={`text-xs ${
                            streakStatus === 'expired' ? 'text-red-600 dark:text-red-400' :
                            streakStatus === 'danger' ? 'text-red-600 dark:text-red-400' : 
                            streakStatus === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {streakStatus === 'expired' ? 'Expired' :
                             streakStatus === 'danger' ? 'Critical' :
                             streakStatus === 'warning' ? 'Warning' :
                             'Healthy'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {streakStatus !== 'expired' ? (
                          <div className="text-center">
                            <span className={`text-lg font-bold ${
                              streakStatus === 'danger' ? 'text-red-600 dark:text-red-400' : 
                              streakStatus === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
                              'text-green-600 dark:text-green-400'
                            }`}>
                              {daysRemaining}
                            </span>
                            <span className="text-xs text-muted-foreground block">days left</span>
                          </div>
                        ) : (
                          <Badge variant="destructive" className="whitespace-nowrap">
                            Restart needed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refer a friend within 30 days to keep your streak active</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Streak Visualization */}
            {currentStreak > 1 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  Streak History
                </h4>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {[...Array(currentStreak)].map((_, index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        index === currentStreak - 1 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-600 dark:from-amber-500 dark:to-orange-700' 
                          : 'bg-orange-100 dark:bg-orange-800/30'
                      }`}
                    >
                      {index === currentStreak - 1 && (
                        <Flame className="h-2 w-2 text-white" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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