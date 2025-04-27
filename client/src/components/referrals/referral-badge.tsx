import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, BadgeCheck, Star, Clock, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ReferralBadgeProps {
  minimal?: boolean;
}

// Tier status badges with descriptions and visual elements
const tierInfo = {
  'none': {
    icon: <Star className="h-10 w-10 text-muted-foreground" />,
    name: 'Getting Started',
    color: 'border-muted-foreground text-muted-foreground',
    bgColor: 'bg-background',
    description: 'Make your first successful referral to start earning rewards',
    benefits: ['Earn 500 points per referral', 'Track your progress', 'Compete on the leaderboard']
  },
  'bronze': {
    icon: <Medal className="h-10 w-10 text-amber-700" />,
    name: 'Bronze Referrer',
    color: 'border-amber-700 text-amber-700',
    bgColor: 'bg-amber-700/10',
    description: "You've made your first successful referral",
    benefits: ['500 points bonus', 'Bronze badge display on your profile', 'Early access to new features']
  },
  'silver': {
    icon: <Medal className="h-10 w-10 text-gray-400" />,
    name: 'Silver Referrer',
    color: 'border-gray-400 text-gray-400',
    bgColor: 'bg-gray-200/20',
    description: "You've successfully referred 5 or more friends",
    benefits: ['1,500 points bonus', 'Silver badge display', 'One free premium prediction per week']
  },
  'gold': {
    icon: <Trophy className="h-10 w-10 text-yellow-400" />,
    name: 'Gold Referrer',
    color: 'border-yellow-400 text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    description: "You've successfully referred 10 or more friends",
    benefits: ['5,000 points bonus', 'Gold badge display', 'One week free premium access']
  },
  'platinum': {
    icon: <Award className="h-10 w-10 text-blue-300" />,
    name: 'Platinum Referrer',
    color: 'border-blue-300 text-blue-300',
    bgColor: 'bg-blue-300/10',
    description: 'Elite status for 25+ successful referrals',
    benefits: ['15,000 points bonus', 'Platinum badge display', 'One month free premium access', 'VIP Customer Support']
  }
};

export const ReferralBadge: FC<ReferralBadgeProps> = ({ minimal = false }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user's referral stats to determine tier
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/referrals/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/referrals/stats');
      return res.json();
    },
    onError: () => {
      toast({
        title: "Error fetching referral stats",
        description: "Could not load your referral information",
        variant: "destructive",
      });
    }
  });
  
  const getUserTier = () => {
    if (!stats) return 'none';
    
    if (stats.completedReferrals >= 25) return 'platinum';
    if (stats.completedReferrals >= 10) return 'gold';
    if (stats.completedReferrals >= 5) return 'silver';
    if (stats.completedReferrals >= 1) return 'bronze';
    
    return 'none';
  };
  
  const tier = getUserTier();
  const info = tierInfo[tier];
  
  if (minimal) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center rounded-full w-8 h-8 ${info.bgColor} border ${info.color}`}>
          <BadgeCheck className={`h-4 w-4 ${info.color}`} />
        </div>
        <div>
          <p className={`text-sm font-medium ${info.color}`}>{info.name}</p>
        </div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-primary" />
          Referral Status
        </CardTitle>
        <CardDescription>
          Your achievements as a referrer
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Clock className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className={`flex items-center justify-center rounded-full w-20 h-20 ${info.bgColor} border-2 ${info.color}`}>
                {info.icon}
              </div>
              
              <h3 className={`text-xl font-bold ${info.color}`}>{info.name}</h3>
              
              <p className="text-center text-sm text-muted-foreground max-w-56">
                {info.description}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium">Referrals: </span>
                <span className="text-lg font-bold text-primary">{stats?.completedReferrals || 0}</span>
              </div>
            </div>
            
            {/* Benefits list */}
            {stats?.completedReferrals > 0 && (
              <div className="border rounded-md p-3 space-y-2">
                <h4 className="font-medium">Your Benefits</h4>
                <ul className="space-y-1.5">
                  {info.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};