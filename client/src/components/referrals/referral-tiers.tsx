import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReferralBadge } from "./referral-badge";
import { Gift } from "lucide-react";

interface ReferralTiersProps {
  totalReferrals: number;
}

export const ReferralTiers: FC<ReferralTiersProps> = ({ totalReferrals }) => {
  // Define the tier thresholds
  const tiers = [
    { tier: 'bronze', threshold: 1, rewards: ['500 points', 'Bronze Badge'] },
    { tier: 'silver', threshold: 5, rewards: ['2,500 points', 'Silver Badge', '1-week Premium'] },
    { tier: 'gold', threshold: 10, rewards: ['5,000 points', 'Gold Badge', '2-week Premium'] },
    { tier: 'platinum', threshold: 25, rewards: ['12,500 points', 'Platinum Badge', '1-month Premium'] },
  ] as const;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Referral Achievement Tiers
        </CardTitle>
        <CardDescription>
          Earn badges and rewards by referring friends
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiers.map(({ tier, threshold, rewards }) => (
            <ReferralBadge 
              key={tier}
              tier={tier}
              count={totalReferrals}
              threshold={threshold}
              acquired={totalReferrals >= threshold}
            />
          ))}
        </div>
        
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium">Tier Benefits:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map(({ tier, threshold, rewards }) => (
              <div key={tier} className="border rounded-lg p-3">
                <h4 className="font-medium capitalize flex items-center">
                  <span className={`
                    w-3 h-3 rounded-full mr-2
                    ${tier === 'bronze' ? 'bg-amber-700' : 
                      tier === 'silver' ? 'bg-gray-400' : 
                      tier === 'gold' ? 'bg-yellow-400' : 'bg-blue-300'}
                  `}></span>
                  {tier} Tier
                </h4>
                <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                  {rewards.map((reward, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-xs">•</span>
                      <span>{reward}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};