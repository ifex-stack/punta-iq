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
  const isEarned = userBadge?.achieved || false;
  const isNew = userBadge?.isNew || false;
  
  const badgeTierColors = {
    bronze: "bg-amber-700",
    silver: "bg-gray-400",
    gold: "bg-yellow-400",
    platinum: "bg-blue-300",
    diamond: "bg-purple-400"
  };
  
  // Set default values if properties don't exist
  const defaultBadge = {
    name: badge.name || "Badge",
    description: badge.description || "Complete this challenge to earn a badge",
    tier: badge.tier || "bronze",
    icon: badge.icon || "🏆",
    pointsAwarded: badge.pointsAwarded || 0,
    criteria: badge.criteria || "Complete the challenge"
  };
  
  const tierColor = isEarned ? badgeTierColors[defaultBadge.tier as keyof typeof badgeTierColors] : "bg-gray-200";
  
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
          <CardTitle className="text-lg">{defaultBadge.name}</CardTitle>
          {isEarned && (
            <UIBadge className={`${tierColor} capitalize`}>
              {defaultBadge.tier}
            </UIBadge>
          )}
        </div>
        <CardDescription>{defaultBadge.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-center items-center p-4">
          <div className={`w-16 h-16 rounded-full ${tierColor} flex items-center justify-center`}>
            <span className="text-2xl">{defaultBadge.icon}</span>
          </div>
        </div>
        
        {userBadge && typeof userBadge.progress === 'number' && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{userBadge.progress}%</span>
            </div>
            <Progress value={userBadge.progress} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        <p className="text-xs text-muted-foreground">
          {isEarned && userBadge?.earnedAt 
            ? `Earned on ${new Date(userBadge.earnedAt).toLocaleDateString()}`
            : defaultBadge.criteria}
        </p>
      </CardFooter>
    </Card>
  );
};