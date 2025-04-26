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
  const isNew = isEarned && userBadge.isNew;
  
  const badgeTierColors = {
    bronze: "bg-amber-700",
    silver: "bg-gray-400",
    gold: "bg-yellow-400",
    platinum: "bg-blue-300",
    diamond: "bg-purple-400"
  };
  
  const tierColor = isEarned ? badgeTierColors[badge.tier as keyof typeof badgeTierColors] : "bg-gray-200";
  
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
              {badge.tier}
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
              <span>
                {(() => {
                  // Type narrowing for userBadge.progress
                  type ProgressType = { current: number; target: number };
                  try {
                    const progressData = userBadge.progress as unknown as ProgressType;
                    if (progressData && typeof progressData === 'object' && 
                        'current' in progressData && 'target' in progressData) {
                      return `${progressData.current}/${progressData.target}`;
                    }
                    return 'In progress';
                  } catch (e) {
                    return 'In progress';
                  }
                })()}
              </span>
            </div>
            {(() => {
              // Type narrowing for progress bar
              type ProgressType = { current: number; target: number };
              try {
                const progressData = userBadge.progress as unknown as ProgressType;
                if (progressData && typeof progressData === 'object' && 
                    'current' in progressData && 'target' in progressData &&
                    typeof progressData.current === 'number' && 
                    typeof progressData.target === 'number' && 
                    progressData.target > 0) {
                  return <Progress value={(progressData.current / progressData.target) * 100} />;
                }
                return null;
              } catch (e) {
                return null;
              }
            })()}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        <p className="text-xs text-muted-foreground">
          {isEarned 
            ? `Earned on ${new Date(userBadge.earnedAt).toLocaleDateString()}`
            : "Complete the challenge to earn this badge"}
        </p>
      </CardFooter>
    </Card>
  );
};