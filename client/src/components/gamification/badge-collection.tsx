import { FC, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, UserBadge } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { BadgeCard } from "./badge-card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface BadgeCollectionProps {
  title?: string;
}

export const BadgeCollection: FC<BadgeCollectionProps> = ({ title = "Your Badges" }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const {
    data: badges,
    isLoading: isLoadingBadges,
    error: badgesError
  } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  const {
    data: userBadges,
    isLoading: isLoadingUserBadges,
    error: userBadgesError
  } = useQuery<UserBadge[]>({
    queryKey: ["/api/users", user?.id, "badges"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Function to handle marking a badge as viewed
  const handleMarkViewed = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "badges"] });
  };
  
  // Check if there's any unviewed badge to show a notification
  useEffect(() => {
    if (userBadges && userBadges.some(badge => badge.isNew)) {
      // You could trigger a notification here or add a badge counter to a menu
    }
  }, [userBadges]);
  
  if (isLoadingBadges || isLoadingUserBadges) {
    return (
      <div className="w-full flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (badgesError || userBadgesError) {
    return (
      <div className="text-center text-destructive p-4">
        Error loading badges. Please try again later.
      </div>
    );
  }
  
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No badges available yet.
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map(badge => {
          const userBadge = userBadges?.find(ub => ub.badgeId === badge.id);
          return (
            <BadgeCard 
              key={badge.id} 
              badge={badge} 
              userBadge={userBadge}
              onMarkViewed={handleMarkViewed}
            />
          );
        })}
      </div>
    </div>
  );
};