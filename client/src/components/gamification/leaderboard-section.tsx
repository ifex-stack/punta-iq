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
  // Create mock data for development to ensure proper formatting with all required fields
  const mockEntries = [
    { id: 1, userId: 1, leaderboardId: leaderboardId, points: 240, rank: 1, previousRank: 2, details: {}, lastUpdated: new Date() },
    { id: 2, userId: 2, leaderboardId: leaderboardId, points: 218, rank: 2, previousRank: 1, details: {}, lastUpdated: new Date() },
    { id: 3, userId: 3, leaderboardId: leaderboardId, points: 205, rank: 3, previousRank: 3, details: {}, lastUpdated: new Date() },
    { id: 4, userId: 4, leaderboardId: leaderboardId, points: 192, rank: 4, previousRank: 5, details: {}, lastUpdated: new Date() },
    { id: 5, userId: 5, leaderboardId: leaderboardId, points: 187, rank: 5, previousRank: 4, details: {}, lastUpdated: new Date() },
    { id: 6, userId: 6, leaderboardId: leaderboardId, points: 176, rank: 6, previousRank: 6, details: {}, lastUpdated: new Date() },
    { id: 7, userId: 7, leaderboardId: leaderboardId, points: 164, rank: 7, previousRank: 10, details: {}, lastUpdated: new Date() },
    { id: 8, userId: 8, leaderboardId: leaderboardId, points: 158, rank: 8, previousRank: 7, details: {}, lastUpdated: new Date() },
    { id: 9, userId: 9, leaderboardId: leaderboardId, points: 145, rank: 9, previousRank: 8, details: {}, lastUpdated: new Date() },
    { id: 10, userId: 10, leaderboardId: leaderboardId, points: 132, rank: 10, previousRank: 9, details: {}, lastUpdated: new Date() }
  ];
  
  const {
    data: leaderboardsResponse,
    isLoading,
    error
  } = useQuery<Record<string, Leaderboard>>({
    queryKey: ["/api/leaderboards"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !leaderboardsResponse) {
    return (
      <div className="text-center text-muted-foreground p-2">
        Could not load this leaderboard.
      </div>
    );
  }
  
  // Find the leaderboard by ID
  const leaderboards = Object.values(leaderboardsResponse);
  const leaderboard = leaderboards.find(lb => lb.id === leaderboardId);
  
  if (!leaderboard) {
    return (
      <div className="text-center text-muted-foreground p-2">
        Leaderboard not found.
      </div>
    );
  }
  
  return (
    <LeaderboardCard
      leaderboard={leaderboard}
      entries={mockEntries}
      currentUserId={currentUserId}
    />
  );
};