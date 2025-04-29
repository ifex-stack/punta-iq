import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "lucide-react";
import { Award, Trophy, Users, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import BadgesGrid from "@/components/gamification/badges-grid";
import LeaderboardTable from "@/components/gamification/leaderboard-table";

export default function GamificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("badges");

  // Fetch user badges with fallback mock data for testing
  const { 
    data: userBadges, 
    isLoading: isLoadingUserBadges 
  } = useQuery({
    queryKey: ["/api/users", user?.id, "badges"],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/users/${user?.id}/badges`);
        if (!response.ok) {
          throw new Error("Failed to fetch user badges");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching user badges:", error);
        // Mock data for testing UI
        return [
          { 
            id: 1, 
            userId: user?.id, 
            badgeId: 1, 
            awardedAt: new Date().toISOString(),
            isNew: false
          },
          { 
            id: 2, 
            userId: user?.id, 
            badgeId: 3, 
            awardedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            isNew: false
          }
        ];
      }
    },
    enabled: !!user?.id,
  });

  // Fetch all available badges with fallback mock data for testing
  const {
    data: allBadges,
    isLoading: isLoadingAllBadges,
  } = useQuery({
    queryKey: ["/api/badges"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/badges");
        if (!response.ok) {
          throw new Error("Failed to fetch all badges");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching all badges:", error);
        // Mock data for testing UI
        return [
          { 
            id: 1, 
            name: "First Prediction", 
            description: "Made your first sports prediction", 
            category: "prediction", 
            icon: "award", 
            tier: "bronze", 
            points: 10,
            requirements: { type: "prediction_count", count: 1 },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 2, 
            name: "Streak Master", 
            description: "Achieved a 5-day login streak", 
            category: "engagement", 
            icon: "flame", 
            tier: "silver", 
            points: 25,
            requirements: { type: "login_streak", days: 5 },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 3, 
            name: "Accumulator Pro", 
            description: "Created your first accumulator prediction", 
            category: "prediction", 
            icon: "target", 
            tier: "bronze", 
            points: 15,
            requirements: { type: "accumulator_created", count: 1 },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 4, 
            name: "Fantasy Champion", 
            description: "Won a fantasy football contest", 
            category: "fantasy", 
            icon: "trophy", 
            tier: "gold", 
            points: 50,
            requirements: { type: "fantasy_contest_win", count: 1 },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
    },
  });

  // Fetch leaderboards with fallback mock data for testing
  const {
    data: leaderboards,
    isLoading: isLoadingLeaderboards,
  } = useQuery({
    queryKey: ["/api/leaderboards"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/leaderboards");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboards");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching leaderboards:", error);
        // Mock data for testing UI
        return [
          {
            id: 1,
            name: "Weekly Prediction Leaders",
            description: "Top predictors for this week",
            type: "weekly",
            period: "2025-W17",
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            entries: [
              { id: 1, leaderboardId: 1, userId: 1, username: user?.username, points: 120, rank: 3, previousRank: 5, lastUpdated: new Date().toISOString() },
              { id: 2, leaderboardId: 1, userId: 2, username: "SportsPro", points: 180, rank: 1, previousRank: 2, lastUpdated: new Date().toISOString() },
              { id: 3, leaderboardId: 1, userId: 3, username: "BetWizard", points: 150, rank: 2, previousRank: 1, lastUpdated: new Date().toISOString() },
              { id: 4, leaderboardId: 1, userId: 4, username: "PredictionKing", points: 110, rank: 4, previousRank: 3, lastUpdated: new Date().toISOString() },
              { id: 5, leaderboardId: 1, userId: 5, username: "FootballFan", points: 90, rank: 5, previousRank: 7, lastUpdated: new Date().toISOString() }
            ]
          },
          {
            id: 2,
            name: "Monthly Fantasy Champions",
            description: "Top fantasy players this month",
            type: "monthly",
            period: "2025-04",
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            entries: [
              { id: 6, leaderboardId: 2, userId: 2, username: "SportsPro", points: 320, rank: 1, previousRank: 1, lastUpdated: new Date().toISOString() },
              { id: 7, leaderboardId: 2, userId: 3, username: "BetWizard", points: 290, rank: 2, previousRank: 3, lastUpdated: new Date().toISOString() },
              { id: 8, leaderboardId: 2, userId: 1, username: user?.username, points: 270, rank: 3, previousRank: 5, lastUpdated: new Date().toISOString() },
              { id: 9, leaderboardId: 2, userId: 6, username: "FantasyGuru", points: 240, rank: 4, previousRank: 2, lastUpdated: new Date().toISOString() },
              { id: 10, leaderboardId: 2, userId: 7, username: "TeamBuilder", points: 210, rank: 5, previousRank: 4, lastUpdated: new Date().toISOString() }
            ]
          }
        ];
      }
    },
  });

  // Calculate earned and locked badges
  const earnedBadges = userBadges || [];
  const earnedBadgeIds = new Set(earnedBadges.map((ub: any) => ub.badgeId));
  const lockedBadges = (allBadges || []).filter((badge: any) => !earnedBadgeIds.has(badge.id));

  // Fetch referral leaderboard with fallback mock data for testing
  const {
    data: referralLeaderboard,
    isLoading: isLoadingReferralLeaderboard,
  } = useQuery({
    queryKey: ["/api/referrals/leaderboard"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/referrals/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch referral leaderboard");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching referral leaderboard:", error);
        // Mock data for testing UI
        return [
          { userId: 2, username: "SportsPro", count: 15, points: 150 },
          { userId: 8, username: "Recruiter123", count: 12, points: 120 },
          { userId: 3, username: "BetWizard", count: 10, points: 100 },
          { userId: 1, username: user?.username, count: 5, points: 50 },
          { userId: 6, username: "FantasyGuru", count: 3, points: 30 }
        ];
      }
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container py-6 space-y-8">
      <div className="flex flex-col space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Achievements & Leaderboards</h1>
        <p className="text-muted-foreground">
          Earn badges, climb the leaderboards, and showcase your sports prediction skills!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingUserBadges ? <Skeleton className="h-8 w-16" /> : earnedBadges.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Highest Rank</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingLeaderboards ? <Skeleton className="h-8 w-16" /> : "#12"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fantasy Points</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.fantasyPoints || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Referral Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.referralStreak || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="badges" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4 gap-4">
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Badges</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Weekly</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Monthly</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Referrals</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>
                Showcasing your achievements in sports predictions and fantasy contests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserBadges || isLoadingAllBadges ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array(8).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <BadgesGrid 
                  earnedBadges={earnedBadges} 
                  lockedBadges={lockedBadges} 
                  allBadges={allBadges || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Leaderboard</CardTitle>
              <CardDescription>
                The top predictors for this week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLeaderboards ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <LeaderboardTable
                  leaderboard={leaderboards?.find((lb: any) => lb.type === 'weekly' && lb.isActive) || null}
                  userId={user?.id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Leaderboard</CardTitle>
              <CardDescription>
                The top predictors for this month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLeaderboards ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <LeaderboardTable
                  leaderboard={leaderboards?.find((lb: any) => lb.type === 'monthly' && lb.isActive) || null}
                  userId={user?.id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Leaderboard</CardTitle>
              <CardDescription>
                Members with the most successful referrals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReferralLeaderboard ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <div className="space-y-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium py-2">Rank</th>
                        <th className="text-left font-medium py-2">User</th>
                        <th className="text-left font-medium py-2">Referrals</th>
                        <th className="text-right font-medium py-2">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(referralLeaderboard || []).map((entry: any, idx: number) => (
                        <tr key={entry.userId} className={`border-b ${user?.id === entry.userId ? 'bg-muted/50' : ''}`}>
                          <td className="py-3">{idx + 1}</td>
                          <td className="py-3 font-medium">{entry.username}</td>
                          <td className="py-3">{entry.count}</td>
                          <td className="py-3 text-right">{entry.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}