import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck, Award, Gift } from "lucide-react";

interface ReferralBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  count: number;
  threshold: number;
  acquired: boolean;
}

export const ReferralBadge: FC<ReferralBadgeProps> = ({ 
  tier, 
  count, 
  threshold,
  acquired
}) => {
  // Badge styling based on the tier
  const tierConfigs = {
    'bronze': {
      bgColor: "bg-amber-700/20",
      borderColor: "border-amber-700",
      fillColor: "bg-amber-700",
      icon: <Gift className="h-6 w-6 text-amber-700" />,
      label: 'Bronze Referrer'
    },
    'silver': {
      bgColor: "bg-gray-400/20",
      borderColor: "border-gray-400",
      fillColor: "bg-gray-400",
      icon: <Award className="h-6 w-6 text-gray-400" />,
      label: 'Silver Networker'
    },
    'gold': {
      bgColor: "bg-yellow-400/20",
      borderColor: "border-yellow-400",
      fillColor: "bg-yellow-400",
      icon: <Award className="h-6 w-6 text-yellow-400" />,
      label: 'Gold Influencer'
    },
    'platinum': {
      bgColor: "bg-blue-300/20",
      borderColor: "border-blue-300",
      fillColor: "bg-blue-300",
      icon: <BadgeCheck className="h-6 w-6 text-blue-300" />,
      label: 'Platinum Ambassador'
    }
  };
  
  const { bgColor, borderColor, fillColor, icon, label } = tierConfigs[tier];
  const progress = Math.min(100, (count / threshold) * 100);
  
  return (
    <Card className={`
      ${acquired ? `border-2 ${borderColor}` : 'border border-border'}
      ${acquired ? 'shadow-md' : 'opacity-80'}
      transition-all duration-300
    `}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className={`
            w-14 h-14 rounded-full ${bgColor} 
            flex items-center justify-center mb-2
            ${acquired ? 'ring-2 ring-offset-2 ' + borderColor : ''}
          `}>
            {icon}
            {acquired && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-sm">{label}</h3>
          
          <div className="mt-3 w-full space-y-1">
            <div className="flex justify-between text-xs">
              <span>{count} referrals</span>
              <span className="font-semibold">{threshold} required</span>
            </div>
            <Progress value={progress} className={`h-2 ${acquired ? fillColor : ''}`} />
          </div>
          
          {acquired ? (
            <span className="text-xs text-green-600 mt-2 font-medium">Achieved!</span>
          ) : (
            <span className="text-xs text-muted-foreground mt-2">
              {threshold - count} more to unlock
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};