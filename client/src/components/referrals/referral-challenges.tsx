import { FC, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Trophy, 
  Star, 
  Calendar, 
  Target, 
  Gift, 
  Unlock, 
  Lock, 
  CheckCircle2,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReferralChallengesProps {
  className?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  reward: number;
  target: number;
  current: number;
  status: 'locked' | 'in-progress' | 'completed' | 'claimed';
  endDate?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'daily' | 'weekly' | 'monthly' | 'special';
}

export const ReferralChallenges: FC<ReferralChallengesProps> = ({ className }) => {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // Fetch challenges data
  const { data: challengesData, isLoading } = useQuery({
    queryKey: ['/api/referrals/challenges'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/referrals/challenges');
        return res.json();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load challenges",
          variant: "destructive",
        });
        return { challenges: [] };
      }
    }
  });
  
  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await apiRequest('POST', '/api/referrals/claim-challenge', {
        challengeId
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Challenge Reward Claimed!",
        description: `You earned ${data.points} points!`,
      });
      
      // Invalidate challenges data to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/challenges'] });
    },
    onError: () => {
      toast({
        title: "Failed to Claim Reward",
        description: "Something went wrong, please try again",
        variant: "destructive",
      });
    }
  });
  
  // Mock challenges data (would be replaced by real API data)
  const mockChallenges: Challenge[] = [
    {
      id: "daily-1",
      title: "First Referral of the Day",
      description: "Refer your first friend today",
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      reward: 100,
      target: 1,
      current: 0,
      status: 'in-progress',
      endDate: new Date(new Date().setHours(23, 59, 59)).toISOString(),
      difficulty: 'easy',
      type: 'daily'
    },
    {
      id: "daily-2",
      title: "Social Sharer",
      description: "Share your referral link on 2 social platforms",
      icon: <Star className="h-5 w-5 text-amber-500" />,
      reward: 150,
      target: 2,
      current: 1,
      status: 'in-progress',
      endDate: new Date(new Date().setHours(23, 59, 59)).toISOString(),
      difficulty: 'easy',
      type: 'daily'
    },
    {
      id: "weekly-1",
      title: "Referral Hunter",
      description: "Refer 5 friends this week",
      icon: <Target className="h-5 w-5 text-green-500" />,
      reward: 500,
      target: 5,
      current: 3,
      status: 'in-progress',
      endDate: getEndOfWeek().toISOString(),
      difficulty: 'medium',
      type: 'weekly'
    },
    {
      id: "monthly-1",
      title: "Referral Champion",
      description: "Refer 15 friends this month",
      icon: <Trophy className="h-5 w-5 text-purple-500" />,
      reward: 2000,
      target: 15,
      current: 8,
      status: 'in-progress',
      endDate: getEndOfMonth().toISOString(),
      difficulty: 'hard',
      type: 'monthly'
    },
    {
      id: "special-1",
      title: "Premier League Special",
      description: "Refer 3 friends during Premier League weekend",
      icon: <Gift className="h-5 w-5 text-red-500" />,
      reward: 750,
      target: 3,
      current: 3,
      status: 'completed',
      endDate: new Date(2025, 5, 15).toISOString(),
      difficulty: 'medium',
      type: 'special'
    },
    {
      id: "special-2",
      title: "Champion's League Final",
      description: "Refer 5 friends during the CL final week",
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      reward: 1500,
      target: 5,
      current: 0,
      status: 'locked',
      endDate: new Date(2025, 5, 30).toISOString(),
      difficulty: 'hard',
      type: 'special'
    }
  ];
  
  // Helper functions for dates
  function getEndOfWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilSunday = 7 - dayOfWeek;
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }
  
  function getEndOfMonth() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    return lastDay;
  }
  
  // Format remaining time
  function formatRemainingTime(endDateStr: string) {
    const endDate = new Date(endDateStr);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m left`;
    }
  }
  
  // Get difficulty color
  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case 'easy':
        return "text-green-500 dark:text-green-400";
      case 'medium':
        return "text-amber-500 dark:text-amber-400";
      case 'hard':
        return "text-red-500 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  }
  
  // Get filtered challenges
  const challenges = challengesData?.challenges || mockChallenges;
  
  const filteredChallenges = activeFilter === "all" 
    ? challenges 
    : challenges.filter(challenge => challenge.type === activeFilter);
    
  const completedChallenges = challenges.filter(c => c.status === 'completed' || c.status === 'claimed').length;
  const totalAvailableChallenges = challenges.filter(c => c.status !== 'locked').length;
  
  // Handle claim click
  const handleClaimClick = (challengeId: string) => {
    claimRewardMutation.mutate(challengeId);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Referral Challenges
        </CardTitle>
        <CardDescription>
          Complete challenges to earn bonus points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Challenge Stats */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-xl font-bold">{completedChallenges}/{totalAvailableChallenges}</p>
          </div>
          <div className="w-1/2">
            <p className="text-sm text-muted-foreground mb-1">Progress</p>
            <Progress value={(completedChallenges / totalAvailableChallenges) * 100} />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          <Button 
            variant={activeFilter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={activeFilter === "daily" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter("daily")}
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Daily
          </Button>
          <Button 
            variant={activeFilter === "weekly" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter("weekly")}
          >
            <Target className="h-3.5 w-3.5 mr-1" />
            Weekly
          </Button>
          <Button 
            variant={activeFilter === "monthly" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter("monthly")}
          >
            <Trophy className="h-3.5 w-3.5 mr-1" />
            Monthly
          </Button>
          <Button 
            variant={activeFilter === "special" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter("special")}
          >
            <Star className="h-3.5 w-3.5 mr-1" />
            Special
          </Button>
        </div>
        
        {/* Challenge List */}
        {isLoading ? (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {filteredChallenges.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No challenges found</p>
              </div>
            ) : (
              filteredChallenges.map((challenge) => (
                <div 
                  key={challenge.id} 
                  className={`border rounded-lg p-3 space-y-2 relative ${
                    challenge.status === 'completed' 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : challenge.status === 'locked'
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-70'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {challenge.icon}
                      </div>
                      <div>
                        <h3 className="font-medium flex items-center gap-1.5">
                          {challenge.title}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                                  {challenge.difficulty}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Difficulty level: {challenge.difficulty}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25">
                      +{challenge.reward} points
                    </Badge>
                  </div>
                  
                  {/* Progress bar */}
                  {challenge.status !== 'locked' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{challenge.current}/{challenge.target}</span>
                      </div>
                      <Progress value={(challenge.current / challenge.target) * 100} className="h-2" />
                    </div>
                  )}
                  
                  {/* Bottom row with status/timer and action */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center text-xs">
                      {challenge.status === 'locked' ? (
                        <div className="flex items-center text-muted-foreground">
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          <span>Locked</span>
                        </div>
                      ) : challenge.status === 'completed' ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          <span>Completed</span>
                        </div>
                      ) : challenge.endDate ? (
                        <div className="flex items-center text-amber-600 dark:text-amber-400">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          <span>{formatRemainingTime(challenge.endDate)}</span>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      {challenge.status === 'locked' ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" disabled>
                                <Lock className="h-3.5 w-3.5 mr-1.5" />
                                Locked
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Complete previous challenges to unlock</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : challenge.status === 'completed' ? (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleClaimClick(challenge.id)}
                          disabled={claimRewardMutation.isPending && claimRewardMutation.variables === challenge.id}
                        >
                          {claimRewardMutation.isPending && claimRewardMutation.variables === challenge.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Gift className="h-3.5 w-3.5 mr-1.5" />
                              Claim Reward
                            </>
                          )}
                        </Button>
                      ) : challenge.status === 'claimed' ? (
                        <Button size="sm" variant="ghost" disabled>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Claimed
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          <Info className="h-3.5 w-3.5 mr-1.5" />
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};