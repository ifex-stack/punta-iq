import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Gift, 
  Calendar, 
  Crown, 
  Award, 
  Diamond,
  ArrowRight,
  Check,
  Clock
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReferralMilestonesProps {
  className?: string;
}

interface Milestone {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  referralsRequired: number;
  reward: {
    type: 'points' | 'subscription' | 'badge' | 'special';
    value: string | number;
    description: string;
  };
  status: 'locked' | 'in-progress' | 'completed';
  completedDate?: string;
  progress: number;
}

export const ReferralMilestones: FC<ReferralMilestonesProps> = ({ className }) => {
  const { toast } = useToast();
  
  // Fetch milestones data
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ['/api/referrals/milestones'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/referrals/milestones');
        return res.json();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load milestones",
          variant: "destructive",
        });
        return { milestones: [] };
      }
    }
  });
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Mock milestones data (would be replaced by real API data)
  const mockMilestones: Milestone[] = [
    {
      id: 1,
      title: "First Referral",
      description: "Get your first friend to join",
      icon: <Gift className="h-5 w-5 text-green-500" />,
      referralsRequired: 1,
      reward: {
        type: 'points',
        value: 500,
        description: "Bonus points"
      },
      status: 'completed',
      completedDate: '2025-04-15T12:00:00Z',
      progress: 100
    },
    {
      id: 2,
      title: "Growing Network",
      description: "Get 5 friends to join",
      icon: <Award className="h-5 w-5 text-amber-500" />,
      referralsRequired: 5,
      reward: {
        type: 'points',
        value: 1500,
        description: "Bonus points"
      },
      status: 'completed',
      completedDate: '2025-04-22T14:30:00Z',
      progress: 100
    },
    {
      id: 3,
      title: "Super Referrer",
      description: "Get 10 friends to join",
      icon: <Trophy className="h-5 w-5 text-purple-500" />,
      referralsRequired: 10,
      reward: {
        type: 'badge',
        value: 'Super Referrer',
        description: "Exclusive badge and 3,000 points"
      },
      status: 'in-progress',
      progress: 80
    },
    {
      id: 4,
      title: "Network Champion",
      description: "Get 25 friends to join",
      icon: <Crown className="h-5 w-5 text-yellow-500" />,
      referralsRequired: 25,
      reward: {
        type: 'subscription',
        value: '1 month',
        description: "Free 1-month Pro subscription"
      },
      status: 'in-progress',
      progress: 32
    },
    {
      id: 5,
      title: "Referral Legend",
      description: "Get 50 friends to join",
      icon: <Diamond className="h-5 w-5 text-blue-500" />,
      referralsRequired: 50,
      reward: {
        type: 'special',
        value: 'VIP',
        description: "VIP status & 3-month Elite subscription"
      },
      status: 'locked',
      progress: 16
    }
  ];
  
  // Use either real data or mock data
  const milestones = milestonesData?.milestones || mockMilestones;
  
  // Find current milestone (the one in progress with lowest referrals required)
  const currentMilestone = milestones.find(m => m.status === 'in-progress');
  
  // Count completed milestones
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Referral Milestones
        </CardTitle>
        <CardDescription>
          Build your referral network and unlock exclusive rewards
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current milestone highlight */}
        {currentMilestone && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <span>Current Milestone</span>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {currentMilestone.progress}% Complete
              </Badge>
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                {currentMilestone.icon}
              </div>
              <div>
                <h4 className="font-medium">{currentMilestone.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {currentMilestone.description}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between text-sm py-2">
              <div>
                <span className="font-medium">Target:</span>
                <span className="ml-1">{currentMilestone.referralsRequired} referrals</span>
              </div>
              <div>
                <span className="font-medium">Reward:</span>
                <span className="ml-1">{currentMilestone.reward.description}</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-primary/10 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${currentMilestone.progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Progress overview */}
        <div className="flex justify-between items-center py-2 px-1">
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-xl font-bold">{completedCount}/{milestones.length}</p>
          </div>
          {completedCount === milestones.length ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">All Complete!</Badge>
          ) : (
            <Badge variant="outline" className="text-primary">In Progress</Badge>
          )}
        </div>
        
        {/* Milestones timeline */}
        {isLoading ? (
          <div className="space-y-4 mt-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="relative pl-8 mt-6 space-y-0">
            {/* Timeline connector */}
            <div className="absolute top-0 left-3.5 bottom-0 w-0.5 bg-border"></div>
            
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative pb-8">
                {/* Timeline node */}
                <div className={`absolute left-[-28px] w-7 h-7 rounded-full flex items-center justify-center z-10 
                  ${milestone.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : milestone.status === 'in-progress' 
                    ? 'bg-primary/20' 
                    : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  {milestone.status === 'completed' ? (
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : milestone.status === 'in-progress' ? (
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                
                {/* Milestone card */}
                <div className={`pl-2 ${milestone.status === 'locked' ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{milestone.title}</h3>
                      {milestone.status === 'completed' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                                Completed
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Completed on {formatDate(milestone.completedDate)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    
                    <Badge variant="outline">
                      {milestone.referralsRequired} referrals
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {milestone.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 text-primary">
                      <Gift className="h-3.5 w-3.5" />
                      <span>Reward:</span>
                    </div>
                    <span className="font-medium">{milestone.reward.description}</span>
                  </div>
                  
                  {/* Progress indicator for in-progress milestones */}
                  {milestone.status === 'in-progress' && (
                    <div className="mt-2 w-full bg-primary/10 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full" 
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Tips */}
        <div className="bg-muted/50 rounded-md p-3 text-sm mt-4">
          <h4 className="font-medium flex items-center gap-1.5 mb-2">
            <Trophy className="h-4 w-4 text-primary" />
            Milestone Tips
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 mt-0.5 min-w-[12px] text-primary" />
              <span>Milestones track your all-time referral count, not just active referrals</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 mt-0.5 min-w-[12px] text-primary" />
              <span>Share your success on social media to attract more referrals</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 mt-0.5 min-w-[12px] text-primary" />
              <span>Rewards are automatically credited when a milestone is reached</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};