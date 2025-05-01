import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Leaderboard, LeaderboardEntry } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { LeaderboardCard } from "./leaderboard-card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardSectionProps {
  title?: string;
}

export const LeaderboardSection: FC<LeaderboardSectionProps> = ({ 
  title = "Leaderboards" 
}) => {
  const { user } = useAuth();
  
  const {
    data: leaderboardsResponse,
    isLoading,
    error
  } = useQuery<Record<string, Leaderboard>>({
    queryKey: ["/api/leaderboards"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Convert object to array if needed
  const leaderboards = leaderboardsResponse ? Object.values(leaderboardsResponse) : [];
  
  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        Error loading leaderboards. Please try again later.
      </div>
    );
  }
  
  if (!leaderboards || leaderboards.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No leaderboards available yet.
      </div>
    );
  }
  
  // Group leaderboards by type
  const leaderboardsByType: Record<string, Leaderboard[]> = {};
  
  leaderboards.forEach(leaderboard => {
    const type = leaderboard.type || "general";
    if (!leaderboardsByType[type]) {
      leaderboardsByType[type] = [];
    }
    leaderboardsByType[type].push(leaderboard);
  });
  
  const leaderboardTypes = Object.keys(leaderboardsByType);
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      {leaderboardTypes.length > 1 ? (
        <Tabs defaultValue={leaderboardTypes[0]}>
          <TabsList className="mb-4">
            {leaderboardTypes.map(type => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {leaderboardTypes.map(type => (
            <TabsContent key={type} value={type}>
              <div className="space-y-6">
                {leaderboardsByType[type].map(leaderboard => (
                  <LeaderboardDetail 
                    key={leaderboard.id} 
                    leaderboardId={leaderboard.id} 
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="space-y-6">
          {leaderboards.map(leaderboard => (
            <LeaderboardDetail 
              key={leaderboard.id} 
              leaderboardId={leaderboard.id} 
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface LeaderboardDetailProps {
  leaderboardId: number;
  currentUserId?: number;
}

interface LeaderboardResponse {
  leaderboard: Leaderboard;
  entries: LeaderboardEntry[];
}

const LeaderboardDetail: FC<LeaderboardDetailProps> = ({ 
  leaderboardId, 
  currentUserId 
}) => {
  const {
    data,
    isLoading,
    error
  } = useQuery<LeaderboardResponse>({
    queryKey: ["/api/leaderboards", leaderboardId],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="text-center text-muted-foreground p-2">
        Could not load this leaderboard.
      </div>
    );
  }
  
  return (
    <LeaderboardCard
      leaderboard={data.leaderboard}
      entries={data.entries}
      currentUserId={currentUserId}
    />
  );
};