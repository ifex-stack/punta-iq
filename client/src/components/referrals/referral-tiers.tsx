import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, BarChart, CheckCircle, Clock } from "lucide-react";
import { CustomProgress } from "@/components/ui/custom-progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ReferralTiersProps {
  userId: number;
  className?: string;
}

export const ReferralTiers: FC<ReferralTiersProps> = ({ userId, className }) => {
  const { toast } = useToast();
  
  // Get user's referral stats including tier information
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/referrals/stats', userId],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/referrals/stats');
      return res.json();
    },
    onError: () => {
      toast({
        title: "Error loading referral stats",
        description: "Could not load your referral statistics",
        variant: "destructive",
      });
    }
  });
  
  // Define tiers with requirements and rewards
  const tiers = [
    {
      name: 'Bronze',
      icon: <Medal className="h-5 w-5 text-amber-700" />,
      requirement: 1,
      rewards: ['500 points bonus', 'Bronze badge', '3 premium predictions'],
      color: 'bg-amber-700',
      textColor: 'text-amber-700'
    },
    {
      name: 'Silver',
      icon: <Medal className="h-5 w-5 text-gray-400" />,
      requirement: 5,
      rewards: ['1,500 points bonus', 'Silver badge', 'Early access to predictions'],
      color: 'bg-gray-400',
      textColor: 'text-gray-400'
    },
    {
      name: 'Gold',
      icon: <Medal className="h-5 w-5 text-yellow-400" />,
      requirement: 10,
      rewards: ['5,000 points bonus', 'Gold badge', 'Double referral points'],
      color: 'bg-yellow-400',
      textColor: 'text-yellow-400'
    },
    {
      name: 'Platinum',
      icon: <Medal className="h-5 w-5 text-blue-300" />,
      requirement: 25,
      rewards: ['15,000 points bonus', 'Platinum badge', '1 month premium'],
      color: 'bg-blue-300',
      textColor: 'text-blue-300'
    },
    {
      name: 'Diamond',
      icon: <Medal className="h-5 w-5 text-cyan-400" />,
      requirement: 50,
      rewards: ['30,000 points bonus', 'Diamond badge', 'VIP Status Permanent'],
      color: 'bg-cyan-400',
      textColor: 'text-cyan-400'
    }
  ];
  
  // Find current tier based on completed referrals
  const getCurrentTier = () => {
    if (!stats) return null;
    
    // Find current tier
    const currentTier = tiers.filter(tier => 
      stats.completedReferrals >= tier.requirement
    ).pop();
    
    return currentTier;
  };
  
  // Find next tier
  const getNextTier = () => {
    if (!stats) return null;
    
    // Find next tier
    const nextTier = tiers.find(tier => 
      stats.completedReferrals < tier.requirement
    );
    
    return nextTier;
  };
  
  // Calculate progress to next tier
  const calculateProgress = () => {
    if (!stats) return 0;
    
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    
    if (!nextTier) return 100; // Already at max tier
    if (!currentTier) return (stats.completedReferrals / nextTier.requirement) * 100;
    
    const remaining = nextTier.requirement - currentTier.requirement;
    const progress = (stats.completedReferrals - currentTier.requirement) / remaining;
    
    return Math.min(Math.max(progress, 0), 1) * 100;
  };
  
  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart className="w-5 h-5 text-primary" />
          Referral Tiers
        </CardTitle>
        <CardDescription>
          Earn rewards as you climb the ranks
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        ) : stats ? (
          <>
            {/* Current Tier Display */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Current Tier</p>
                <div className="flex items-center gap-2 mt-1">
                  {currentTier ? (
                    <>
                      {currentTier.icon}
                      <h3 className={`text-lg font-bold ${currentTier.textColor}`}>
                        {currentTier.name}
                      </h3>
                    </>
                  ) : (
                    <h3 className="text-lg font-bold text-muted-foreground">
                      Not Ranked Yet
                    </h3>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Completed Referrals</p>
                <h3 className="text-2xl font-bold text-primary">{stats.completedReferrals}</h3>
              </div>
            </div>
            
            {/* Progress to next tier */}
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to {nextTier.name}</span>
                  <span className="font-medium">
                    {stats.completedReferrals}/{nextTier.requirement} referrals
                  </span>
                </div>
                <CustomProgress
                  value={calculateProgress()}
                  className="h-3"
                  indicatorClassName={nextTier.color}
                />
                <p className="text-xs text-muted-foreground">
                  {nextTier.requirement - stats.completedReferrals} more referrals needed to reach {nextTier.name}
                </p>
              </div>
            )}
            
            {/* Tiers List */}
            <div className="space-y-3 mt-6">
              <h4 className="font-medium">All Tiers</h4>
              <div className="space-y-3">
                {tiers.map((tier) => (
                  <div 
                    key={tier.name}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      currentTier && currentTier.name === tier.name ? 'bg-muted border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${tier.color} flex items-center justify-center`}>
                        {tier.icon}
                      </div>
                      <div>
                        <h5 className="font-medium flex items-center gap-2">
                          {tier.name}
                          {currentTier && currentTier.name === tier.name && (
                            <Badge variant="outline" className="ml-1">Current</Badge>
                          )}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {tier.requirement} referrals required
                        </p>
                      </div>
                    </div>
                    <div className="text-xs max-w-28">
                      {tier.rewards.map((reward, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          <span>{reward}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Unlocked Perks Section */}
            {stats?.perks && stats.perks.length > 0 && (
              <div className="mt-8 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Your Unlocked Perks
                </h4>
                <div className="space-y-2 border rounded-lg p-3">
                  {stats.perks
                    .filter(perk => perk.isUnlocked)
                    .map((perk, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center text-white ${
                          perk.tier === 'bronze' ? 'bg-amber-700' : 
                          perk.tier === 'silver' ? 'bg-gray-400' : 
                          perk.tier === 'gold' ? 'bg-yellow-400' : 
                          perk.tier === 'platinum' ? 'bg-blue-300' : 
                          'bg-cyan-400'
                        }`}>
                          <CheckCircle className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{perk.name}</p>
                          <p className="text-xs text-muted-foreground">{perk.description}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* Tier History */}
            {stats?.tierHistory && stats.tierHistory.length > 0 && (
              <div className="mt-8 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Tier Achievement History
                </h4>
                <div className="relative border-l-2 border-primary/30 ml-2 pl-4 py-2 space-y-4">
                  {stats.tierHistory.map((history, index) => (
                    <div key={index} className="relative">
                      <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-primary -translate-x-[1.65rem]"></div>
                      <p className="text-sm capitalize font-medium">{history.tier} Tier Achieved</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(history.achievedAt).toLocaleDateString('en-US', {
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Failed to load tier information</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};