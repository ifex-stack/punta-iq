import { FC } from "react";
import { Badge, UserBadge } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge;
  onMarkViewed?: () => void;
}

export const BadgeCard: FC<BadgeCardProps> = ({ badge, userBadge, onMarkViewed }) => {
  const { toast } = useToast();
  const isEarned = !!userBadge;
  const isNew = isEarned && !userBadge.isViewed;
  
  const badgeTierColors = {
    bronze: "bg-amber-700",
    silver: "bg-gray-400",
    gold: "bg-yellow-400",
    platinum: "bg-blue-300",
    diamond: "bg-purple-400"
  };
  
  const tierColor = isEarned ? badgeTierColors[userBadge.tier as keyof typeof badgeTierColors] : "bg-gray-200";
  
  const handleMarkAsViewed = async () => {
    if (isNew && userBadge) {
      try {
        await apiRequest("PATCH", `/api/users/${userBadge.userId}/badges/${userBadge.badgeId}/viewed`);
        if (onMarkViewed) {
          onMarkViewed();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not mark badge as viewed",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <Card 
      className={`relative overflow-hidden transition-all ${isEarned ? 'border-primary' : 'opacity-70'} ${isNew ? 'animate-pulse' : ''}`}
      onClick={handleMarkAsViewed}
    >
      {isNew && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-md">
          NEW
        </span>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{badge.name}</CardTitle>
          {isEarned && (
            <UIBadge className={`${tierColor} capitalize`}>
              {userBadge.tier}
            </UIBadge>
          )}
        </div>
        <CardDescription>{badge.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-center items-center p-4">
          <div className={`w-16 h-16 rounded-full ${tierColor} flex items-center justify-center`}>
            <span className="text-2xl">{badge.icon || '🏆'}</span>
          </div>
        </div>
        
        {isEarned && userBadge.progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{userBadge.progress.current}/{userBadge.progress.target}</span>
            </div>
            <Progress value={(userBadge.progress.current / userBadge.progress.target) * 100} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        <p className="text-xs text-muted-foreground">
          {isEarned 
            ? `Earned on ${new Date(userBadge.awardedAt).toLocaleDateString()}`
            : "Complete the challenge to earn this badge"}
        </p>
      </CardFooter>
    </Card>
  );
};